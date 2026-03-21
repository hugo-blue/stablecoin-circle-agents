import { describe, it, expect, vi, beforeEach } from 'vitest'
import { probeX402Endpoint } from '@/lib/x402-probe'

// ─── probeX402Endpoint ────────────────────────────────────────────────────────

describe('probeX402Endpoint', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns payTo address when server responds with 402 and valid header', async () => {
    const fakeHeader = JSON.stringify({
      version: 'x402-1',
      accepts: [{
        scheme: 'exact',
        network: 'eip155:8453',
        maxAmountRequired: '1000000',
        payTo: '0xabc1234567890123456789012345678901234def',
        asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      }],
    })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 402,
      headers: {
        get: (name: string) =>
          name.toLowerCase() === 'x-payment-requirements' ? fakeHeader : null,
      },
    }))

    const result = await probeX402Endpoint('https://api.example.com/paid-endpoint')
    expect(result).toBe('0xabc1234567890123456789012345678901234def')
  })

  it('returns null when server does not respond with 402', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      headers: { get: () => null },
    }))

    const result = await probeX402Endpoint('https://api.example.com/free-endpoint')
    expect(result).toBeNull()
  })

  it('returns null when 402 response is missing X-Payment-Requirements header', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 402,
      headers: { get: () => null },
    }))

    const result = await probeX402Endpoint('https://api.example.com/broken-402')
    expect(result).toBeNull()
  })

  it('returns null when X-Payment-Requirements header is invalid JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 402,
      headers: { get: () => 'not-json{' },
    }))

    const result = await probeX402Endpoint('https://api.example.com/bad-header')
    expect(result).toBeNull()
  })

  it('returns null when network request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')))

    const result = await probeX402Endpoint('https://unreachable.example.com')
    expect(result).toBeNull()
  })

  it('returns null for empty or missing endpoint URL', async () => {
    expect(await probeX402Endpoint('')).toBeNull()
    expect(await probeX402Endpoint(null as unknown as string)).toBeNull()
  })

  it('truncates timeout — does not hang on slow servers', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 60_000))
    ))

    const start = Date.now()
    const result = await probeX402Endpoint('https://slow.example.com', { timeoutMs: 50 })
    const elapsed = Date.now() - start

    expect(result).toBeNull()
    expect(elapsed).toBeLessThan(500)
  }, 2000)

  it('sends GET request with x402-probe User-Agent', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 402,
      headers: { get: () => null },
    })
    vi.stubGlobal('fetch', mockFetch)

    await probeX402Endpoint('https://api.example.com/endpoint')

    const [_url, init] = mockFetch.mock.calls[0]
    expect(init?.method ?? 'GET').toBe('GET')
    expect(init?.headers?.['User-Agent']).toContain('x402-probe')
  })
})
