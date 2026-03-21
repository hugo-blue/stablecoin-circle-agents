import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, clearCache } from '@/app/api/ai-payments/providers/route'

// ─── helpers ────────────────────────────────────────────────────────────────

function isIsoTimestamp(value: unknown): boolean {
  if (typeof value !== 'string') return false
  return !isNaN(Date.parse(value))
}

const VALID_TRACK_STATUSES = ['verified', 'endpoint_known', 'pending', 'not_x402']

// ─── contract: response shape ────────────────────────────────────────────────

describe('GET /api/ai-payments/providers', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // Clear in-process cache so each test gets a fresh probe run
    clearCache()
    // Prevent real outbound probe requests in unit tests
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 404,
      headers: { get: () => null },
    }))
  })

  it('returns correct top-level shape', async () => {
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveProperty('state')
    expect(['success', 'error']).toContain(body.state)
    expect(body).toHaveProperty('data')
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('each provider entry has required fields', async () => {
    const res = await GET()
    const body = await res.json()

    if (body.state === 'success') {
      expect(body.data.length).toBeGreaterThan(0)
      for (const item of body.data) {
        expect(typeof item.name).toBe('string')
        expect(typeof item.category).toBe('string')
        expect(typeof item.chain).toBe('string')
        // payToAddress: string or null
        expect(item.payToAddress === null || typeof item.payToAddress === 'string').toBe(true)
        // endpoint: string or null
        expect(item.endpoint === null || typeof item.endpoint === 'string').toBe(true)
        // priceUsdc: number or null
        expect(item.priceUsdc === null || typeof item.priceUsdc === 'number').toBe(true)
        // trackStatus
        expect(VALID_TRACK_STATUSES).toContain(item.trackStatus)
        // lastCheckedAt: isoTimestamp or null
        expect(
          item.lastCheckedAt === null || isIsoTimestamp(item.lastCheckedAt)
        ).toBe(true)
      }
    }
  })

  it('priceUsdc is non-negative when set', async () => {
    const res = await GET()
    const body = await res.json()

    for (const item of body.data) {
      if (item.priceUsdc !== null) {
        expect(item.priceUsdc).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('verified providers have non-null payToAddress', async () => {
    const res = await GET()
    const body = await res.json()

    for (const item of body.data) {
      if (item.trackStatus === 'verified') {
        expect(item.payToAddress).not.toBeNull()
        expect(typeof item.payToAddress).toBe('string')
        expect(item.payToAddress.length).toBeGreaterThan(0)
      }
    }
  })
})
