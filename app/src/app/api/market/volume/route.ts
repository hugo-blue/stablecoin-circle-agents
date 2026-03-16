import { NextResponse } from 'next/server'

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'

const COIN_IDS: Record<string, string> = {
  USDT: 'tether',
  USDC: 'usd-coin',
}

/**
 * Fetch daily trading volume from CoinGecko for USDT and USDC
 * Returns up to 365 days of daily data
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = searchParams.get('days') || '90'

  try {
    const results = await Promise.all(
      Object.entries(COIN_IDS).map(async ([symbol, id]) => {
        const res = await fetch(
          `${COINGECKO_BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}&interval=daily`,
          { next: { revalidate: 3600 } }
        )
        if (!res.ok) throw new Error(`CoinGecko error for ${symbol}: ${res.status}`)
        const data = await res.json()

        const volumes = (data.total_volumes || []).map(([ts, vol]: [number, number]) => ({
          date: new Date(ts).toISOString().split('T')[0],
          volume: Math.round(vol),
        }))

        return { symbol, volumes }
      })
    )

    return NextResponse.json({ data: results })
  } catch (err: any) {
    console.error('Volume API error:', err.message)
    return NextResponse.json({ data: null, error: err.message }, { status: 502 })
  }
}
