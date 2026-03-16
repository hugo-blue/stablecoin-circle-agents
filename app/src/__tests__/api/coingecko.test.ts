import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchStablecoinMarkets } from '@/lib/api/coingecko'

const MOCK_COINGECKO_RESPONSE = [
  {
    id: 'tether',
    symbol: 'usdt',
    name: 'Tether',
    market_cap: 140_000_000_000,
    current_price: 1.0001,
    price_change_percentage_24h: 0.02,
    circulating_supply: 140_000_000_000,
  },
  {
    id: 'usd-coin',
    symbol: 'usdc',
    name: 'USD Coin',
    market_cap: 60_000_000_000,
    current_price: 0.9999,
    price_change_percentage_24h: -0.01,
    circulating_supply: 60_000_000_000,
  },
]

describe('fetchStablecoinMarkets', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('maps CoinGecko response to StablecoinMarket[]', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_COINGECKO_RESPONSE),
    }))

    const result = await fetchStablecoinMarkets()
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      id: 'tether',
      symbol: 'USDT',
      name: 'Tether',
      marketCap: 140_000_000_000,
      price: 1.0001,
      priceChange24h: 0.02,
      circulatingSupply: 140_000_000_000,
    })
  })

  it('uppercases symbol', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_COINGECKO_RESPONSE),
    }))

    const result = await fetchStablecoinMarkets()
    expect(result[0].symbol).toBe('USDT')
    expect(result[1].symbol).toBe('USDC')
  })

  it('defaults missing fields to 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { id: 'test', symbol: 'test', name: 'Test' },
      ]),
    }))

    const result = await fetchStablecoinMarkets()
    expect(result[0].marketCap).toBe(0)
    expect(result[0].price).toBe(0)
    expect(result[0].priceChange24h).toBe(0)
    expect(result[0].circulatingSupply).toBe(0)
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
    }))

    await expect(fetchStablecoinMarkets()).rejects.toThrow('CoinGecko API error: 429')
  })

  it('calls correct URL with stablecoin ids', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })
    vi.stubGlobal('fetch', mockFetch)

    await fetchStablecoinMarkets()
    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('tether')
    expect(calledUrl).toContain('usd-coin')
    expect(calledUrl).toContain('dai')
    expect(calledUrl).toContain('vs_currency=usd')
  })
})
