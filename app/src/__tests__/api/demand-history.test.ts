import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, clearCache } from '@/app/api/ai-payments/demand-history/route'

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

// 3 days ago and 10 days ago (for WoW star test)
const recentStarredAt = new Date(Date.now() - 3 * 86400000).toISOString()
const oldStarredAt = new Date(Date.now() - 10 * 86400000).toISOString()

function makeFetch() {
  return vi.fn().mockImplementation((url: string) => {
    if (url.includes('api.github.com/repos') && !url.includes('stargazers')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ stargazers_count: 200 }) })
    }
    if (url.includes('stargazers')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { starred_at: recentStarredAt },
          { starred_at: oldStarredAt },
        ]),
      })
    }
    // npm range API
    return Promise.resolve({ ok: true, json: () => Promise.resolve(makeDailyData()) })
  })
}

// ─── contract: response shape ────────────────────────────────────────────────

describe('GET /api/ai-payments/demand-history', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    clearCache()
    vi.stubGlobal('fetch', makeFetch())
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

  it('starWoW field exists with required shape', async () => {
    const res = await GET()
    const body = await res.json()

    expect(body.data).toHaveProperty('starWoW')
    const { starWoW } = body.data
    for (const key of ['x402', 'agentkit', 'openclaw']) {
      if (starWoW[key] !== null) {
        expect(typeof starWoW[key].lastWeek).toBe('number')
        expect(typeof starWoW[key].prevWeek).toBe('number')
        expect(starWoW[key].lastWeek).toBeGreaterThanOrEqual(0)
        expect(starWoW[key].prevWeek).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('starWoW lastWeek counts only stars within 7 days', async () => {
    const res = await GET()
    const body = await res.json()

    if (body.data.starWoW.x402 !== null) {
      // Mock returns [recent(3d), old(10d)] for EACH of the 2 pages fetched
      // → all = 4 items: 2 recent (lastWeek), 2 old (prevWeek)
      expect(body.data.starWoW.x402.lastWeek).toBe(2)
      expect(body.data.starWoW.x402.prevWeek).toBe(2)
    }
  })

  it('returns partial state when some npm packages fail', async () => {
    let callCount = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('api.github.com')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ stargazers_count: 10 }) })
      }
      if (url.includes('stargazers')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
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
