import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/ai-payments/demand-stats/route'

// ─── mock helpers ─────────────────────────────────────────────────────────────

function makeGithubRepo(stars: number) {
  return { ok: true, json: () => Promise.resolve({ stargazers_count: stars, forks_count: 100 }) }
}

function makeNpm(downloads: number, pkg: string) {
  return { ok: true, json: () => Promise.resolve({ downloads, package: pkg }) }
}

function stubFetch(map: Record<string, unknown>) {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) => {
    for (const [key, val] of Object.entries(map)) {
      if (url.includes(key)) return Promise.resolve(val)
    }
    return Promise.reject(new Error(`Unexpected URL: ${url}`))
  }))
}

function fullStub(weekMultiplier = 1, monthMultiplier = 4) {
  return {
    'repos/openclaw/openclaw': makeGithubRepo(327415),
    'repos/coinbase/agentkit': makeGithubRepo(1166),
    'repos/coinbase/x402': makeGithubRepo(5741),
    'last-week/x402': makeNpm(124892 * weekMultiplier, 'x402'),
    'last-week/@coinbase/agentkit': makeNpm(3469 * weekMultiplier, '@coinbase/agentkit'),
    'last-week/@coinbase/x402': makeNpm(13547 * weekMultiplier, '@coinbase/x402'),
    'last-month/x402': makeNpm(124892 * monthMultiplier, 'x402'),
    'last-month/@coinbase/agentkit': makeNpm(3469 * monthMultiplier, '@coinbase/agentkit'),
    'last-month/@coinbase/x402': makeNpm(13547 * monthMultiplier, '@coinbase/x402'),
  }
}

// ─── contract ────────────────────────────────────────────────────────────────

describe('GET /api/ai-payments/demand-stats', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('returns correct top-level shape', async () => {
    stubFetch(fullStub())
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(['success', 'partial', 'error']).toContain(body.state)
    expect(typeof body.updatedAt).toBe('string')
    expect(body).toHaveProperty('data')
  })

  it('data has openclaw, agentkit, x402, clawHub fields with monthly data', async () => {
    stubFetch(fullStub())
    const res = await GET()
    const { data } = await res.json()

    expect(typeof data.openclaw.stars).toBe('number')

    expect(typeof data.agentkit.stars).toBe('number')
    expect(typeof data.agentkit.npmWeekly).toBe('number')
    expect(typeof data.agentkit.npmMonthly).toBe('number')

    expect(typeof data.x402.stars).toBe('number')
    expect(typeof data.x402.npmWeekly).toBe('number')
    expect(typeof data.x402.npmMonthly).toBe('number')
    expect(typeof data.x402.coinbaseX402Weekly).toBe('number')
    expect(typeof data.x402.coinbaseX402Monthly).toBe('number')

    expect(typeof data.clawHub.totalSkills).toBe('number')
    expect(Array.isArray(data.clawHub.x402Skills)).toBe(true)
  })

  it('maps GitHub star and npm counts correctly', async () => {
    stubFetch(fullStub())
    const res = await GET()
    const { data } = await res.json()

    expect(data.openclaw.stars).toBe(327415)
    expect(data.agentkit.stars).toBe(1166)
    expect(data.x402.stars).toBe(5741)
    expect(data.x402.npmWeekly).toBe(124892)
    expect(data.x402.npmMonthly).toBe(124892 * 4)
    expect(data.x402.coinbaseX402Weekly).toBe(13547)
    expect(data.x402.coinbaseX402Monthly).toBe(13547 * 4)
    expect(data.agentkit.npmWeekly).toBe(3469)
    expect(data.agentkit.npmMonthly).toBe(3469 * 4)
  })

  it('npmGrowthPct is a number when both week and month are available', async () => {
    // week=2x the average of prior 3 weeks → strong growth
    stubFetch(fullStub(2, 5)) // last month = 5 weeks worth, last week = 2x average
    const res = await GET()
    const { data } = await res.json()

    // growthPct = (lastWeek - priorWeekAvg) / priorWeekAvg * 100
    // priorWeekAvg = (monthly - lastWeek) / 3
    expect(typeof data.x402.npmGrowthPct).toBe('number')
    expect(data.x402.npmGrowthPct).toBeGreaterThan(0) // growing
  })

  it('npmGrowthPct is null when monthly data is missing', async () => {
    stubFetch({
      ...fullStub(),
      'last-month/x402': { ok: false, json: () => Promise.resolve({}) },
      'last-month/@coinbase/agentkit': { ok: false, json: () => Promise.resolve({}) },
      'last-month/@coinbase/x402': { ok: false, json: () => Promise.resolve({}) },
    })
    const res = await GET()
    const { data } = await res.json()
    expect(data.x402.npmGrowthPct).toBeNull()
  })

  it('returns state=partial when some upstreams fail', async () => {
    stubFetch({
      ...fullStub(),
      'repos/coinbase/agentkit': { ok: false, json: () => Promise.resolve({}) },
      'repos/coinbase/x402': { ok: false, json: () => Promise.resolve({}) },
    })
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.state).toBe('partial')
    expect(body.data.openclaw.stars).toBe(327415)
    expect(body.data.agentkit.stars).toBeNull()
  })

  it('returns state=error when all upstreams fail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.state).toBe('error')
  })
})
