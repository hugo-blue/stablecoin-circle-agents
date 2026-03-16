import { NextRequest, NextResponse } from 'next/server'
import { fetchStablecoinChart, parseNetFlows, STABLECOIN_IDS } from '@/lib/api/defillama'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol') || 'USDC'
  const id = searchParams.get('id') || String(STABLECOIN_IDS[symbol] || 2)

  try {
    const chartData = await fetchStablecoinChart(parseInt(id))
    const flows = parseNetFlows(chartData, symbol)
    return NextResponse.json({
      data: flows,
      state: 'success',
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to fetch mint/burn data:', error)
    return NextResponse.json(
      { data: null, state: 'error', updatedAt: null, error: 'Failed to fetch mint/burn data' },
      { status: 502 }
    )
  }
}
