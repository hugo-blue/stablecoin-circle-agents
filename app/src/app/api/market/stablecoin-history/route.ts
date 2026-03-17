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
      fetchTreasuryRateHistory(365).catch(() => [] as Array<{ date: string; rate: number }>),
    ])
    const rateHistory = rateHistoryResult

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
