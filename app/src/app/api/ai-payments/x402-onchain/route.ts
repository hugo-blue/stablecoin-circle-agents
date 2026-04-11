import { NextResponse } from 'next/server'
import { CDP_FACILITATOR_ADDRESSES, BASE_USDC_CONTRACT } from '@/lib/data/cdp-facilitators'

// ─── Types ────────────────────────────────────────────────────────────────────

type BasescanTx = {
  timeStamp: string
  to: string
  isError: string
}

export type DailyTxCount = { date: string; txCount: number }

export type X402OnchainData = {
  dailyTxCounts: DailyTxCount[]  // last 30 days, ascending
  totalAddresses: number
  activeAddresses: number        // addresses with ≥1 USDC tx in period
}

type CacheEntry = { ts: number; data: X402OnchainData }

// ─── Module-level 1-hour cache ────────────────────────────────────────────────

let cache: CacheEntry | null = null
const CACHE_TTL_MS = 60 * 60 * 1000

/** Reset cache — only for use in tests */
export function _resetCache() { cache = null }

// ─── Basescan query ───────────────────────────────────────────────────────────

async function fetchAddressTxs(address: string, apiKey: string): Promise<BasescanTx[]> {
  const url = new URL('https://api.basescan.org/api')
  url.searchParams.set('module', 'account')
  url.searchParams.set('action', 'txlist')
  url.searchParams.set('address', address)
  url.searchParams.set('sort', 'desc')
  url.searchParams.set('page', '1')
  url.searchParams.set('offset', '200')
  url.searchParams.set('apikey', apiKey)

  const res = await fetch(url.toString())
  if (!res.ok) return []
  const body = await res.json()
  if (body.status !== '1' || !Array.isArray(body.result)) return []
  return body.result as BasescanTx[]
}

// Simple concurrency pool using a shared index counter
async function withConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let next = 0

  async function worker() {
    while (next < tasks.length) {
      const i = next++
      results[i] = await tasks[i]()
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker))
  return results
}

// ─── Aggregation ──────────────────────────────────────────────────────────────

function tsToDate(ts: string): string {
  return new Date(parseInt(ts, 10) * 1000).toISOString().slice(0, 10)
}

function buildDailyMap(allTxs: BasescanTx[][]): { map: Map<string, number>; activeAddresses: number } {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  const map = new Map<string, number>()
  let activeAddresses = 0

  for (const txs of allTxs) {
    let hasActivity = false
    for (const tx of txs) {
      if (tx.isError !== '0') continue
      if (tx.to.toLowerCase() !== BASE_USDC_CONTRACT) continue
      const ms = parseInt(tx.timeStamp, 10) * 1000
      if (ms < cutoff) continue
      const date = tsToDate(tx.timeStamp)
      map.set(date, (map.get(date) ?? 0) + 1)
      hasActivity = true
    }
    if (hasActivity) activeAddresses++
  }

  return { map, activeAddresses }
}

function buildSeries(map: Map<string, number>): DailyTxCount[] {
  const result: DailyTxCount[] = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    result.push({ date, txCount: map.get(date) ?? 0 })
  }
  return result
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    return NextResponse.json({ state: 'success', data: cache.data, updatedAt: new Date(cache.ts).toISOString() })
  }

  const apiKey = process.env.ETHERSCAN_API_KEY
  if (!apiKey) {
    return NextResponse.json({ state: 'error', data: null, updatedAt: new Date().toISOString() })
  }

  const addresses = [...CDP_FACILITATOR_ADDRESSES]
  const tasks = addresses.map(addr => () => fetchAddressTxs(addr, apiKey).catch(() => [] as BasescanTx[]))

  const allTxs = await withConcurrency(tasks, 5)
  const { map, activeAddresses } = buildDailyMap(allTxs)
  const dailyTxCounts = buildSeries(map)

  const data: X402OnchainData = {
    dailyTxCounts,
    totalAddresses: addresses.length,
    activeAddresses,
  }

  cache = { ts: Date.now(), data }

  return NextResponse.json({
    state: 'success',
    data,
    updatedAt: new Date().toISOString(),
  })
}
