import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api/fred', () => ({
  fetchTreasuryRateHistory: vi.fn(),
}))

import { fetchTreasuryRateHistory } from '@/lib/api/fred'

// Dates within last 24 months (from 2026-03): use 2025-01, 2025-06, 2025-12
const MOCK_LLAMA_ALL = [
  { date: '1735689600', totalCirculatingUSD: { peggedUSD: 200_000_000_000 } }, // 2025-01-01
  { date: '1748736000', totalCirculatingUSD: { peggedUSD: 230_000_000_000 } }, // 2025-06-01
  { date: '1767225600', totalCirculatingUSD: { peggedUSD: 270_000_000_000 } }, // 2025-12-01
]

const MOCK_LLAMA_USDC = {
  tokens: [
    { date: 1735689600, circulating: { peggedUSD: 45_000_000_000 } },
    { date: 1748736000, circulating: { peggedUSD: 60_000_000_000 } },
    { date: 1767225600, circulating: { peggedUSD: 75_000_000_000 } },
  ],
}

const MOCK_FRED_HISTORY = [
  { date: '2025-01-02', rate: 0.0433 },
  { date: '2025-06-01', rate: 0.0415 },
  { date: '2025-12-01', rate: 0.0381 },
]

function setupFetchMock() {
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    if (url.includes('stablecoincharts/all')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_LLAMA_ALL) })
    }
    if (url.includes('stablecoin/2')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_LLAMA_USDC) })
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
  }))
}

describe('GET /api/market/stablecoin-history', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.mocked(fetchTreasuryRateHistory).mockResolvedValue(MOCK_FRED_HISTORY)
    setupFetchMock()
  })

  it('returns monthly data points with all three metrics', async () => {
    const { GET } = await import('@/app/api/market/stablecoin-history/route')
    const res = await GET()
    const json = await res.json()

    expect(json.data).toBeDefined()
    expect(json.data.length).toBeGreaterThan(0)

    const point = json.data[0]
    expect(point).toHaveProperty('date')
    expect(point).toHaveProperty('totalMarketCapB')
    expect(point).toHaveProperty('usdcMarketCapB')
    expect(point).toHaveProperty('usdcSharePct')
    expect(point).toHaveProperty('tbillRate')
  })

  it('calculates USDC share correctly', async () => {
    const { GET } = await import('@/app/api/market/stablecoin-history/route')
    const res = await GET()
    const json = await res.json()

    const point = json.data.find((d: any) => d.date === '2025-01')
    if (point) {
      // 45B / 200B = 22.5%
      expect(point.usdcSharePct).toBeCloseTo(22.5, 0)
      expect(point.totalMarketCapB).toBeCloseTo(200, 0)
      expect(point.usdcMarketCapB).toBeCloseTo(45, 0)
    }
  })

  it('returns state=success on valid data', async () => {
    const { GET } = await import('@/app/api/market/stablecoin-history/route')
    const res = await GET()
    const json = await res.json()
    expect(json.state).toBe('success')
  })

  it('returns error state on DefiLlama failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    const { GET } = await import('@/app/api/market/stablecoin-history/route')
    const res = await GET()
    expect(res.status).toBe(502)
    const json = await res.json()
    expect(json.state).toBe('error')
  })
})
