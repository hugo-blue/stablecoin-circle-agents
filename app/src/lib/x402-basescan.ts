/**
 * x402 链上聚合（Basescan）— 共享数据逻辑
 *
 * 从 CDP Facilitator 地址池的 Basescan txlist 拉取，过滤到 Base USDC 合约，
 * 聚合出近 30 天日均交易序列与活跃 facilitator 地址数。
 * 由 /api/ai-payments/x402-onchain 与 /api/ai-payments/x402-stats 共用。
 *
 * 注意：facilitator 地址（≤25 个）的 tx 是「结算笔数」的真实链上下界，
 * 但 activeAddresses = 活跃 facilitator 地址数，**不是买方数**——买方计数无法
 * 从此数据源得出，见各路由对静态字段的标注。
 */
import { CDP_FACILITATOR_ADDRESSES, BASE_USDC_CONTRACT } from '@/lib/data/cdp-facilitators'

export type BasescanTx = { timeStamp: string; to: string; isError: string }
export type DailyTxCount = { date: string; txCount: number }
export type X402OnchainData = {
  dailyTxCounts: DailyTxCount[]  // 近 30 天，升序
  totalAddresses: number
  activeAddresses: number        // 周期内有 ≥1 笔 USDC tx 的 facilitator 地址数
}

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

// 用共享索引计数器实现的简单并发池
async function withConcurrency<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
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

/** 拉取 + 聚合 facilitator 地址池的近 30 天链上交易。抛错由调用方兜底。 */
export async function fetchFacilitatorOnchain(apiKey: string): Promise<X402OnchainData> {
  const addresses = [...CDP_FACILITATOR_ADDRESSES]
  const tasks = addresses.map(addr => () => fetchAddressTxs(addr, apiKey).catch(() => [] as BasescanTx[]))
  const allTxs = await withConcurrency(tasks, 5)
  const { map, activeAddresses } = buildDailyMap(allTxs)
  const dailyTxCounts = buildSeries(map)
  return { dailyTxCounts, totalAddresses: addresses.length, activeAddresses }
}
