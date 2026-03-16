import { NextResponse } from 'next/server'
import { fetchStablecoinMarkets } from '@/lib/api/coingecko'

export async function GET() {
  try {
    const markets = await fetchStablecoinMarkets()
    return NextResponse.json({
      data: markets,
      state: 'success',
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to fetch stablecoin markets:', error)
    return NextResponse.json(
      {
        data: null,
        state: 'error',
        updatedAt: null,
        error: 'Failed to fetch market data',
      },
      { status: 502 }
    )
  }
}
