import { NextResponse } from 'next/server'
import {
  fetchStablecoinChart,
  parseMarketShareHistory,
  parseNetFlows,
  mergeMultiCoinFlows,
  STABLECOIN_IDS,
} from '@/lib/api/defillama'

export async function GET() {
  try {
    const symbols = ['USDT', 'USDC', 'DAI', 'FDUSD']

    // Fetch individual coin charts + total market chart in parallel
    const [totalChart, ...coinCharts] = await Promise.all([
      fetchStablecoinChart(),  // no id = total market
      ...symbols.map(sym => fetchStablecoinChart(STABLECOIN_IDS[sym])),
    ])

    const chartsMap: Record<string, any[]> = {}
    symbols.forEach((sym, i) => {
      chartsMap[sym] = coinCharts[i]
    })

    // Market share with correct total market denominator
    const marketShare = parseMarketShareHistory(chartsMap, totalChart)

    // Multi-coin net flows for stacked bar chart
    const flowsMap: Record<string, any[]> = {}
    symbols.forEach((sym, i) => {
      flowsMap[sym] = parseNetFlows(coinCharts[i], sym)
    })
    const multiCoinFlows = mergeMultiCoinFlows(flowsMap)

    return NextResponse.json({
      data: { marketShare, mintBurn: multiCoinFlows },
      state: 'success',
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to fetch history data:', error)
    return NextResponse.json(
      { data: null, state: 'error', updatedAt: null, error: 'Failed to fetch history' },
      { status: 502 }
    )
  }
}
