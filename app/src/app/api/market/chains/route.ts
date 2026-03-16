import { NextResponse } from 'next/server'
import { fetchStablecoins, parseChainDistributions } from '@/lib/api/defillama'

export async function GET() {
  try {
    const raw = await fetchStablecoins()
    const distributions = parseChainDistributions(raw)
    return NextResponse.json({
      data: distributions,
      state: 'success',
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to fetch chain distributions:', error)
    return NextResponse.json(
      { data: null, state: 'error', updatedAt: null, error: 'Failed to fetch chain data' },
      { status: 502 }
    )
  }
}
