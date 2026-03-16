import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseChainDistributions,
  parseNetFlows,
  parseMarketShareHistory,
  mergeMultiCoinFlows,
  fetchStablecoins,
  fetchStablecoinById,
  fetchStablecoinChart,
  STABLECOIN_IDS,
} from '@/lib/api/defillama'

describe('STABLECOIN_IDS', () => {
  it('maps USDT to 1 and USDC to 2', () => {
    expect(STABLECOIN_IDS.USDT).toBe(1)
    expect(STABLECOIN_IDS.USDC).toBe(2)
  })
})

describe('parseChainDistributions', () => {
  it('parses normal response', () => {
    const raw = {
      peggedAssets: [
        {
          symbol: 'USDT',
          chainCirculating: {
            Ethereum: { current: { peggedUSD: 60_000_000_000 } },
            Tron: { current: { peggedUSD: 40_000_000_000 } },
          },
        },
      ],
    }
    const result = parseChainDistributions(raw)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      chain: 'Ethereum',
      symbol: 'USDT',
      supplyUsd: 60_000_000_000,
      pctOfTotal: 60,
    })
  })

  it('handles empty peggedAssets', () => {
    expect(parseChainDistributions({ peggedAssets: [] })).toEqual([])
  })

  it('handles null/undefined input', () => {
    expect(parseChainDistributions(null)).toEqual([])
    expect(parseChainDistributions(undefined)).toEqual([])
  })

  it('skips chains with zero supply', () => {
    const raw = {
      peggedAssets: [{
        symbol: 'USDC',
        chainCirculating: {
          Ethereum: { current: { peggedUSD: 10_000 } },
          Polygon: { current: { peggedUSD: 0 } },
        },
      }],
    }
    const result = parseChainDistributions(raw)
    expect(result).toHaveLength(1)
    expect(result[0].chain).toBe('Ethereum')
  })

  it('handles multiple assets', () => {
    const raw = {
      peggedAssets: [
        { symbol: 'USDT', chainCirculating: { Ethereum: { current: { peggedUSD: 100 } } } },
        { symbol: 'USDC', chainCirculating: { Ethereum: { current: { peggedUSD: 50 } } } },
      ],
    }
    const result = parseChainDistributions(raw)
    expect(result).toHaveLength(2)
  })
})

describe('parseNetFlows', () => {
  it('calculates net flow from daily circulating diff', () => {
    const chartData = [
      { date: '1700000000', totalCirculatingUSD: { peggedUSD: 50_000_000_000 } },
      { date: '1700086400', totalCirculatingUSD: { peggedUSD: 50_500_000_000 } },
      { date: '1700172800', totalCirculatingUSD: { peggedUSD: 50_300_000_000 } },
    ]
    const result = parseNetFlows(chartData, 'USDC')
    expect(result).toHaveLength(2)
    // Day 1: +500M
    expect(result[0].netFlowUsd).toBe(500_000_000)
    expect(result[0].mintedUsd).toBe(500_000_000)
    expect(result[0].burnedUsd).toBe(0)
    // Day 2: -200M
    expect(result[1].netFlowUsd).toBe(-200_000_000)
    expect(result[1].mintedUsd).toBe(0)
    expect(result[1].burnedUsd).toBe(200_000_000)
  })

  it('handles totalCirculating fallback (no totalCirculatingUSD)', () => {
    const chartData = [
      { date: '1700000000', totalCirculating: { peggedUSD: 100 } },
      { date: '1700086400', totalCirculating: { peggedUSD: 150 } },
    ]
    const result = parseNetFlows(chartData, 'USDT')
    expect(result[0].netFlowUsd).toBe(50)
  })

  it('handles date as string (DefiLlama format)', () => {
    const chartData = [
      { date: '1700000000', totalCirculatingUSD: { peggedUSD: 100 } },
      { date: '1700086400', totalCirculatingUSD: { peggedUSD: 200 } },
    ]
    const result = parseNetFlows(chartData, 'USDC')
    expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns empty for less than 2 entries', () => {
    expect(parseNetFlows([], 'USDC')).toEqual([])
    expect(parseNetFlows([{ date: '1700000000' }], 'USDC')).toEqual([])
  })

  it('returns empty for null/undefined', () => {
    expect(parseNetFlows(null as any, 'USDC')).toEqual([])
    expect(parseNetFlows(undefined as any, 'USDC')).toEqual([])
  })

  it('sets symbol correctly', () => {
    const chartData = [
      { date: '1700000000', totalCirculatingUSD: { peggedUSD: 100 } },
      { date: '1700086400', totalCirculatingUSD: { peggedUSD: 200 } },
    ]
    expect(parseNetFlows(chartData, 'USDT')[0].symbol).toBe('USDT')
  })
})

describe('parseMarketShareHistory', () => {
  it('uses total market chart as denominator when provided', () => {
    const chartsMap = {
      USDT: [{ date: '1700000000', totalCirculatingUSD: { peggedUSD: 80 } }],
      USDC: [{ date: '1700000000', totalCirculatingUSD: { peggedUSD: 20 } }],
    }
    // Total market = 200, so USDT=40%, USDC=10%, Other=50%
    const totalChart = [{ date: '1700000000', totalCirculatingUSD: { peggedUSD: 200 } }]
    const result = parseMarketShareHistory(chartsMap, totalChart)
    expect(result).toHaveLength(1)
    expect(result[0].USDT).toBe(40)
    expect(result[0].USDC).toBe(10)
    expect(result[0].Other).toBe(50)
  })

  it('falls back to sum of tracked coins when no totalChart', () => {
    const chartsMap = {
      USDT: [{ date: '1700000000', totalCirculatingUSD: { peggedUSD: 80 } }],
      USDC: [{ date: '1700000000', totalCirculatingUSD: { peggedUSD: 20 } }],
    }
    const result = parseMarketShareHistory(chartsMap)
    expect(result[0].USDT).toBe(80)
    expect(result[0].USDC).toBe(20)
    expect(result[0].Other).toBe(0)
  })

  it('sorts results by date', () => {
    const chartsMap = {
      USDT: [
        { date: '1700086400', totalCirculatingUSD: { peggedUSD: 100 } },
        { date: '1700000000', totalCirculatingUSD: { peggedUSD: 100 } },
      ],
    }
    const result = parseMarketShareHistory(chartsMap)
    expect(result[0].date < result[1].date).toBe(true)
  })

  it('calculates Other correctly with total market denominator', () => {
    const chartsMap = {
      USDT: [{ date: '1700000000', totalCirculatingUSD: { peggedUSD: 60 } }],
      USDC: [{ date: '1700000000', totalCirculatingUSD: { peggedUSD: 20 } }],
    }
    const totalChart = [{ date: '1700000000', totalCirculatingUSD: { peggedUSD: 100 } }]
    const result = parseMarketShareHistory(chartsMap, totalChart)
    expect(result[0].USDT).toBe(60)
    expect(result[0].USDC).toBe(20)
    expect(result[0].Other).toBe(20)
  })

  it('handles empty input', () => {
    expect(parseMarketShareHistory({})).toEqual([])
  })

  it('handles date as string correctly', () => {
    const chartsMap = {
      USDT: [{ date: '1700000000', totalCirculating: { peggedUSD: 100 } }],
    }
    const result = parseMarketShareHistory(chartsMap)
    expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('mergeMultiCoinFlows', () => {
  it('merges multiple coin flows by date', () => {
    const flowsMap = {
      USDT: [
        { date: '2024-01-01', symbol: 'USDT', mintedUsd: 100, burnedUsd: 0, netFlowUsd: 100 },
        { date: '2024-01-02', symbol: 'USDT', mintedUsd: 0, burnedUsd: 50, netFlowUsd: -50 },
      ],
      USDC: [
        { date: '2024-01-01', symbol: 'USDC', mintedUsd: 200, burnedUsd: 0, netFlowUsd: 200 },
        { date: '2024-01-02', symbol: 'USDC', mintedUsd: 0, burnedUsd: 100, netFlowUsd: -100 },
      ],
    }
    const result = mergeMultiCoinFlows(flowsMap)
    expect(result).toHaveLength(2)
    expect(result[0].date).toBe('2024-01-01')
    expect(result[0].USDT).toBe(100)
    expect(result[0].USDC).toBe(200)
    expect(result[1].USDT).toBe(-50)
    expect(result[1].USDC).toBe(-100)
  })

  it('defaults missing coins to 0', () => {
    const flowsMap = {
      USDT: [{ date: '2024-01-01', symbol: 'USDT', mintedUsd: 100, burnedUsd: 0, netFlowUsd: 100 }],
    }
    const result = mergeMultiCoinFlows(flowsMap)
    expect(result[0].USDC).toBe(0)
    expect(result[0].DAI).toBe(0)
  })

  it('sorts by date', () => {
    const flowsMap = {
      USDT: [
        { date: '2024-01-02', symbol: 'USDT', mintedUsd: 0, burnedUsd: 0, netFlowUsd: 0 },
        { date: '2024-01-01', symbol: 'USDT', mintedUsd: 0, burnedUsd: 0, netFlowUsd: 0 },
      ],
    }
    const result = mergeMultiCoinFlows(flowsMap)
    expect(result[0].date).toBe('2024-01-01')
    expect(result[1].date).toBe('2024-01-02')
  })

  it('handles empty input', () => {
    expect(mergeMultiCoinFlows({})).toEqual([])
  })
})

describe('fetchStablecoins', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(fetchStablecoins()).rejects.toThrow('DefiLlama API error: 500')
  })

  it('returns parsed JSON on success', async () => {
    const mockData = { peggedAssets: [] }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: () => Promise.resolve(mockData),
    }))
    expect(await fetchStablecoins()).toEqual(mockData)
  })
})

describe('fetchStablecoinById', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    await expect(fetchStablecoinById(1)).rejects.toThrow('DefiLlama API error: 404')
  })

  it('fetches correct URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, json: () => Promise.resolve({ tokens: [] }),
    })
    vi.stubGlobal('fetch', mockFetch)
    await fetchStablecoinById(42)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://stablecoins.llama.fi/stablecoin/42',
      expect.any(Object)
    )
  })
})

describe('fetchStablecoinChart', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('fetches correct URL with stablecoin id', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, json: () => Promise.resolve([]),
    })
    vi.stubGlobal('fetch', mockFetch)
    await fetchStablecoinChart(2)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://stablecoins.llama.fi/stablecoincharts/all?stablecoin=2',
      expect.any(Object)
    )
  })

  it('fetches total market URL when no id', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, json: () => Promise.resolve([]),
    })
    vi.stubGlobal('fetch', mockFetch)
    await fetchStablecoinChart()
    expect(mockFetch).toHaveBeenCalledWith(
      'https://stablecoins.llama.fi/stablecoincharts/all',
      expect.any(Object)
    )
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(fetchStablecoinChart(1)).rejects.toThrow('DefiLlama API error: 500')
  })
})
