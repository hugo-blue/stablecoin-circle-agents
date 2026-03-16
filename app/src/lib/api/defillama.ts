import type { ChainDistribution, MintBurnFlow, MarketSharePoint, MultiCoinFlow } from '@/types'

const BASE_URL = 'https://stablecoins.llama.fi'

// DefiLlama stablecoin ID mapping
export const STABLECOIN_IDS: Record<string, number> = {
  USDT: 1,
  USDC: 2,
  DAI: 3,
  FDUSD: 4,
  PYUSD: 5,
}

export async function fetchStablecoins() {
  const res = await fetch(`${BASE_URL}/stablecoins?includePrices=true`, {
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`DefiLlama API error: ${res.status}`)
  return res.json()
}

export async function fetchStablecoinById(id: number) {
  const res = await fetch(`${BASE_URL}/stablecoin/${id}`, {
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`DefiLlama API error: ${res.status}`)
  return res.json()
}

/**
 * Fetch historical circulating supply for a stablecoin (or all if no id)
 */
export async function fetchStablecoinChart(id?: number) {
  const url = id != null
    ? `${BASE_URL}/stablecoincharts/all?stablecoin=${id}`
    : `${BASE_URL}/stablecoincharts/all`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`DefiLlama API error: ${res.status}`)
  return res.json()
}

export function parseChainDistributions(raw: any): ChainDistribution[] {
  const result: ChainDistribution[] = []
  const peggedAssets = raw?.peggedAssets || []

  for (const asset of peggedAssets) {
    const symbol = asset.symbol
    const chainCirculating = asset.chainCirculating || {}
    let totalSupply = 0

    for (const chain of Object.keys(chainCirculating)) {
      totalSupply += chainCirculating[chain]?.current?.peggedUSD || 0
    }

    for (const [chain, data] of Object.entries(chainCirculating) as any[]) {
      const supplyUsd = data?.current?.peggedUSD || 0
      if (supplyUsd > 0) {
        result.push({
          chain,
          symbol,
          supplyUsd,
          pctOfTotal: totalSupply > 0 ? (supplyUsd / totalSupply) * 100 : 0,
        })
      }
    }
  }

  return result
}

function extractCirculating(entry: any): number {
  return entry?.totalCirculatingUSD?.peggedUSD
    ?? entry?.totalCirculating?.peggedUSD
    ?? 0
}

function parseDate(raw: any): string {
  const ts = parseInt(String(raw), 10)
  return new Date(ts * 1000).toISOString().split('T')[0]
}

/**
 * Parse chart data into daily net flows using circulating supply diff
 */
export function parseNetFlows(chartData: any[], symbol: string): MintBurnFlow[] {
  if (!Array.isArray(chartData) || chartData.length < 2) return []

  const flows: MintBurnFlow[] = []
  for (let i = 1; i < chartData.length; i++) {
    const prev = extractCirculating(chartData[i - 1])
    const curr = extractCirculating(chartData[i])
    const netFlow = curr - prev

    flows.push({
      date: parseDate(chartData[i].date),
      symbol,
      mintedUsd: netFlow > 0 ? netFlow : 0,
      burnedUsd: netFlow < 0 ? Math.abs(netFlow) : 0,
      netFlowUsd: netFlow,
    })
  }

  return flows
}

/**
 * Merge multiple coin flows into MultiCoinFlow[] for stacked bar chart
 */
export function mergeMultiCoinFlows(
  flowsMap: Record<string, MintBurnFlow[]>
): MultiCoinFlow[] {
  const dateMap = new Map<string, MultiCoinFlow>()

  for (const [symbol, flows] of Object.entries(flowsMap)) {
    for (const f of flows) {
      if (!dateMap.has(f.date)) {
        dateMap.set(f.date, { date: f.date, USDT: 0, USDC: 0, DAI: 0, FDUSD: 0 })
      }
      dateMap.get(f.date)![symbol] = f.netFlowUsd
    }
  }

  return Array.from(dateMap.values()).sort((a, b) =>
    (a.date as string).localeCompare(b.date as string)
  )
}

/**
 * Parse market share using individual coin charts + total market chart
 * totalChart: /stablecoincharts/all (no stablecoin param) = full market total
 * chartsMap: { USDT: chartData, USDC: chartData, ... }
 */
export function parseMarketShareHistory(
  chartsMap: Record<string, any[]>,
  totalChart?: any[]
): MarketSharePoint[] {
  // Build per-coin date map
  const coinDateMap = new Map<string, Record<string, number>>()

  for (const [symbol, chartData] of Object.entries(chartsMap)) {
    if (!Array.isArray(chartData)) continue
    for (const entry of chartData) {
      const date = parseDate(entry.date)
      if (!coinDateMap.has(date)) coinDateMap.set(date, {})
      coinDateMap.get(date)![symbol] = extractCirculating(entry)
    }
  }

  // Build total market date map
  const totalDateMap = new Map<string, number>()
  if (Array.isArray(totalChart)) {
    for (const entry of totalChart) {
      const date = parseDate(entry.date)
      totalDateMap.set(date, extractCirculating(entry))
    }
  }

  const tracked = ['USDT', 'USDC', 'DAI', 'FDUSD']
  const sorted = Array.from(coinDateMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))

  return sorted.map(([date, values]) => {
    // Use total market as denominator; fallback to sum of tracked coins
    const total = totalDateMap.get(date)
      || Object.values(values).reduce((s, v) => s + v, 0)

    const point: MarketSharePoint = { date }
    let trackedPct = 0

    for (const sym of tracked) {
      const pct = total > 0 ? Math.round(((values[sym] || 0) / total) * 10000) / 100 : 0
      point[sym] = pct
      trackedPct += pct
    }
    point.Other = Math.max(0, Math.round((100 - trackedPct) * 100) / 100)

    return point
  })
}
