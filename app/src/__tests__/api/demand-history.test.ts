import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/ai-payments/demand-history/route'

// ─── helpers ────────────────────────────────────────────────────────────────

function makeDailyData(startIso = '2025-10-01', days = 63) {
  const result: { day: string; downloads: number }[] = []
  const start = new Date(startIso)
  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setUTCDate(start.getUTCDate() + i)
    result.push({ day: d.toISOString().slice(0, 10), downloads: 100 + i * 5 })
  }
  return { downloads: result }
}

// ─── contract: response shape ────────────────────────────────────────────────

describe('GET /api/ai-payments/demand-history', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeDailyData()),
    }))
  })

  it('returns correct top-level shape', async () => {
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveProperty('state')
    expect(['success', 'partial', 'error']).toContain(body.state)
    expect(body).toHaveProperty('data')
  })

  it('each package has a weekly array with required fields', async () => {
    const res = await GET()
    const body = await res.json()

    if (body.state !== 'error') {
      expect(Array.isArray(body.data.x402)).toBe(true)
      expect(Array.isArray(body.data.coinbaseX402)).toBe(true)
      expect(Array.isArray(body.data.agentkit)).toBe(true)

      for (const arr of [body.data.x402, body.data.coinbaseX402, body.data.agentkit]) {
        expect(arr.length).toBeGreaterThanOrEqual(1)
        for (const w of arr) {
          expect(typeof w.weekStart).toBe('string')
          expect(typeof w.downloads).toBe('number')
          expect(w.downloads).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })

  it('weeks are sorted ascending', async () => {
    const res = await GET()
    const body = await res.json()

    if (body.state !== 'error' && body.data.x402.length > 1) {
      const dates: string[] = body.data.x402.map((w: { weekStart: string }) => w.weekStart)
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i] > dates[i - 1]).toBe(true)
      }
    }
  })

  it('returns at most 8 weekly data points per package', async () => {
    const res = await GET()
    const body = await res.json()

    if (body.state !== 'error') {
      expect(body.data.x402.length).toBeLessThanOrEqual(8)
      expect(body.data.coinbaseX402.length).toBeLessThanOrEqual(8)
      expect(body.data.agentkit.length).toBeLessThanOrEqual(8)
    }
  })

  it('returns partial state when some packages fail', async () => {
    let callCount = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(makeDailyData()) })
      }
      return Promise.resolve({ ok: false })
    }))

    const res = await GET()
    const body = await res.json()
    expect(['partial', 'error']).toContain(body.state)
  })
})
