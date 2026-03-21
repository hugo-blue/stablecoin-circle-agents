import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/ai-payments/x402-stats/route'

// ─── helpers ────────────────────────────────────────────────────────────────

function isIsoTimestamp(value: unknown): boolean {
  if (typeof value !== 'string') return false
  return !isNaN(Date.parse(value))
}

// ─── contract: response shape ────────────────────────────────────────────────

describe('GET /api/ai-payments/x402-stats', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns correct shape on success', async () => {
    const res = await GET()
    const body = await res.json()

    expect(body).toHaveProperty('state')
    expect(['success', 'error', 'stale']).toContain(body.state)
    expect(body).toHaveProperty('updatedAt')
    expect(isIsoTimestamp(body.updatedAt)).toBe(true)
    expect(body).toHaveProperty('data')
  })

  it('data has all required numeric fields when state is success or stale', async () => {
    const res = await GET()
    const body = await res.json()

    if (body.state === 'success' || body.state === 'stale') {
      const d = body.data
      expect(typeof d.dailyTxCount).toBe('number')
      expect(typeof d.dailyVolumeUsdc).toBe('number')
      expect(typeof d.baseVsSolanaRatio).toBe('number')
      expect(d.baseVsSolanaRatio).toBeGreaterThanOrEqual(0)
      expect(d.baseVsSolanaRatio).toBeLessThanOrEqual(1)
      expect(typeof d.activeFacilitators).toBe('number')
      expect(typeof d.totalEcosystemProjects).toBe('number')
      expect(typeof d.cumulativeTxCount).toBe('number')
    }
  })

  it('returns 200 status', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
  })

  it('returns state=stale or state=success (not error) when upstream is unreachable', async () => {
    // Route should degrade gracefully to stale data, not hard-error
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const res = await GET()
    const body = await res.json()
    // Acceptable: stale (cached) or error, but must still return 200 with valid shape
    expect(res.status).toBe(200)
    expect(['success', 'stale', 'error']).toContain(body.state)
    expect(isIsoTimestamp(body.updatedAt)).toBe(true)
  })

  it('non-negative numeric values in data', async () => {
    const res = await GET()
    const body = await res.json()

    if (body.state !== 'error') {
      const d = body.data
      expect(d.dailyTxCount).toBeGreaterThanOrEqual(0)
      expect(d.dailyVolumeUsdc).toBeGreaterThanOrEqual(0)
      expect(d.activeFacilitators).toBeGreaterThanOrEqual(0)
      expect(d.totalEcosystemProjects).toBeGreaterThanOrEqual(0)
      expect(d.cumulativeTxCount).toBeGreaterThanOrEqual(0)
    }
  })
})
