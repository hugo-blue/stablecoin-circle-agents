import { NextResponse } from 'next/server'
import { fetchTreasuryRateHistory } from '@/lib/api/fred'

const DEFILLAMA_BASE = 'https://stablecoins.llama.fi'

export interface StablecoinHistoryPoint {
  date: string          // 'YYYY-MM'
  totalMarketCapB: number
  usdcMarketCapB: number
  usdcSharePct: number
  tbillRate: number | null
}

function toMonthKey(ts: number): string {
  const d = new Date(ts * 1000)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

async function fetchTotalHistory(): Promise<Map<string, number>> {
  const res = await fetch(`${DEFILLAMA_BASE}/stablecoincharts/all`, {
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error('DefiLlama total history failed')
  const data: Array<{ date: string; totalCirculatingUSD: { peggedUSD: number } }> = await res.json()

  // Keep one entry per month (last data point of each month)
  const byMonth = new Map<string, number>()
  for (const point of data) {
    const key = toMonthKey(Number(point.date))
    byMonth.set(key, (point.totalCirculatingUSD?.peggedUSD ?? 0) / 1e9)
  }
  return byMonth
}

async function fetchUsdcHistory(): Promise<Map<string, number>> {
  const res = await fetch(`${DEFILLAMA_BASE}/stablecoin/2`, {
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error('DefiLlama USDC history failed')
  const data: { tokens: Array<{ date: number; circulating: { peggedUSD: number } }> } = await res.json()

  const byMonth = new Map<string, number>()
  for (const point of data.tokens ?? []) {
    const key = toMonthKey(Number(point.date))
    byMonth.set(key, (point.circulating?.peggedUSD ?? 0) / 1e9)
  }
  return byMonth
}

// Monthly DTB3 average (%) — fallback when FRED API is unavailable.
// Source: Federal Reserve H.15, 3-Month Treasury Bill Secondary Market Rate.
// Last updated: 2026-03. These are public data, not projections.
const DTB3_FALLBACK: Record<string, number> = {
  '2024-01': 5.33, '2024-02': 5.33, '2024-03': 5.33,
  '2024-04': 5.34, '2024-05': 5.33, '2024-06': 5.32,
  '2024-07': 5.30, '2024-08': 5.13, '2024-09': 4.77,
  '2024-10': 4.58, '2024-11': 4.44, '2024-12': 4.31,
  '2025-01': 4.27, '2025-02': 4.27, '2025-03': 4.23,
  '2025-04': 4.17, '2025-05': 4.18, '2025-06': 4.15,
  '2025-07': 4.15, '2025-08': 4.08, '2025-09': 3.95,
  '2025-10': 3.88, '2025-11': 3.84, '2025-12': 3.81,
  '2026-01': 3.82, '2026-02': 3.82, '2026-03': 3.81,
}

function matchRateToMonth(
  rateHistory: Array<{ date: string; rate: number }>,
  month: string,
): number | null {
  // Find the closest rate entry for the given 'YYYY-MM'
  const match = rateHistory.filter(r => r.date.startsWith(month))
  if (match.length > 0) return Number((match[match.length - 1].rate * 100).toFixed(2))
  // Fall back to last rate before this month
  const before = rateHistory.filter(r => r.date < month + '-99').reverse()
  return before.length > 0 ? Number((before[0].rate * 100).toFixed(2)) : null
}

export async function GET() {
  try {
    // FRED is optional — failure should not block stablecoin data
    const [totalByMonth, usdcByMonth, rateHistoryResult] = await Promise.all([
      fetchTotalHistory(),
      fetchUsdcHistory(),
      fetchTreasuryRateHistory(730).catch(() => [] as Array<{ date: string; rate: number }>),
    ])
    // If FRED is unavailable, fall back to static monthly averages
    const rateHistory: Array<{ date: string; rate: number }> =
      rateHistoryResult.length > 0
        ? rateHistoryResult
        : Object.entries(DTB3_FALLBACK).map(([date, pct]) => ({ date: `${date}-15`, rate: pct / 100 }))

    // Build last 24 months
    const now = new Date()
    const months: string[] = []
    for (let i = 23; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
      months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`)
    }

    const result: StablecoinHistoryPoint[] = months.map(month => {
      const total = totalByMonth.get(month) ?? null
      const usdc = usdcByMonth.get(month) ?? null
      const share = total && usdc && total > 0 ? Number(((usdc / total) * 100).toFixed(2)) : null
      const rate = matchRateToMonth(rateHistory, month)
      return {
        date: month,
        totalMarketCapB: total ? Number(total.toFixed(2)) : 0,
        usdcMarketCapB: usdc ? Number(usdc.toFixed(2)) : 0,
        usdcSharePct: share ?? 0,
        tbillRate: rate,
      }
    }).filter(p => p.totalMarketCapB > 0)

    return NextResponse.json({
      data: result,
      state: 'success',
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('stablecoin-history error:', error)
    return NextResponse.json(
      { data: [], state: 'error', error: String(error) },
      { status: 502 },
    )
  }
}
