import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the FRED API module
vi.mock('@/lib/api/fred', () => ({
  fetchLatestTreasuryRate: vi.fn(),
  fetchTreasuryRateHistory: vi.fn(),
}))

describe('GET /api/rates/treasury', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns expected response shape on success', async () => {
    const { fetchLatestTreasuryRate, fetchTreasuryRateHistory } = await import('@/lib/api/fred')

    vi.mocked(fetchLatestTreasuryRate).mockResolvedValue({
      date: '2026-03-14',
      rate: 0.0381,
    })

    vi.mocked(fetchTreasuryRateHistory).mockResolvedValue([
      { date: '2026-03-12', rate: 0.0382 },
      { date: '2026-03-13', rate: 0.0380 },
      { date: '2026-03-14', rate: 0.0381 },
    ])

    // Mock the internal fetch for USDC circulation (will fail, use fallback)
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/api/stablecoins')) {
        return Promise.resolve({ ok: false, status: 500 })
      }
      // This shouldn't be reached since FRED functions are mocked
      return Promise.resolve({ ok: false, status: 500 })
    }))

    const { GET } = await import('@/app/api/rates/treasury/route')
    const response = await GET()
    const json = await response.json()

    expect(json.state).toBe('success')
    expect(json.data).toBeDefined()
    expect(json.data.latest).toEqual({ date: '2026-03-14', rate: 0.0381 })
    expect(json.data.history).toHaveLength(3)
    expect(json.data.estimatedReserveIncome).toBeDefined()
    expect(json.data.estimatedReserveIncome.daily).toBeGreaterThan(0)
    expect(json.data.estimatedReserveIncome.quarterly).toBeGreaterThan(0)
    expect(json.data.estimatedReserveIncome.annual).toBeGreaterThan(0)
    expect(json.updatedAt).toBeDefined()
  })

  it('returns 502 on FRED API failure', async () => {
    const { fetchLatestTreasuryRate, fetchTreasuryRateHistory } = await import('@/lib/api/fred')

    vi.mocked(fetchLatestTreasuryRate).mockRejectedValue(new Error('FRED API error: 500'))
    vi.mocked(fetchTreasuryRateHistory).mockRejectedValue(new Error('FRED API error: 500'))

    const { GET } = await import('@/app/api/rates/treasury/route')
    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(502)
    expect(json.state).toBe('error')
    expect(json.data).toBeNull()
  })
})
