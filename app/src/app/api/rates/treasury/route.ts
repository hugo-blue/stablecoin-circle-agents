import { NextResponse } from 'next/server'
import { fetchLatestTreasuryRate, fetchTreasuryRateHistory } from '@/lib/api/fred'

const USDC_CIRCULATION_FALLBACK = 78_000_000_000 // $78B fallback

async function fetchUsdcCirculation(): Promise<number> {
  try {
    // Try to get live USDC circulation from the stablecoins endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/stablecoins`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return USDC_CIRCULATION_FALLBACK

    const json = await res.json()
    const usdc = json.data?.find(
      (coin: any) => coin.symbol === 'USDC' || coin.id === 'usd-coin'
    )
    return usdc?.circulatingSupply || usdc?.marketCap || USDC_CIRCULATION_FALLBACK
  } catch {
    return USDC_CIRCULATION_FALLBACK
  }
}

function calcEstimatedReserveIncome(circulation: number, rate: number) {
  return {
    daily: Math.round(circulation * rate * (1 / 365)),
    quarterly: Math.round(circulation * rate * (91 / 365)),
    annual: Math.round(circulation * rate),
  }
}

export async function GET() {
  try {
    const [latest, history, circulation] = await Promise.all([
      fetchLatestTreasuryRate(),
      fetchTreasuryRateHistory(90),
      fetchUsdcCirculation(),
    ])

    const estimatedReserveIncome = calcEstimatedReserveIncome(circulation, latest.rate)

    return NextResponse.json({
      data: {
        latest,
        history,
        estimatedReserveIncome,
      },
      state: 'success',
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to fetch treasury rates:', error)
    return NextResponse.json(
      { data: null, state: 'error', updatedAt: null, error: 'Failed to fetch treasury rate data' },
      { status: 502 }
    )
  }
}
