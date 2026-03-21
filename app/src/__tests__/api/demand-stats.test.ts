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

// ─── contract ────────────────────────────────────────────────────────────────

describe('GET /api/ai-payments/demand-stats', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('returns correct top-level shape', async () => {
    stubFetch({
      'repos/openclaw/openclaw': makeGithubRepo(327415),
      'repos/coinbase/agentkit': makeGithubRepo(1166),
      'repos/coinbase/x402': makeGithubRepo(5741),
      'downloads/point/last-week/x402': makeNpm(124892, 'x402'),
      'downloads/point/last-week/@coinbase/agentkit': makeNpm(3469, '@coinbase/agentkit'),
      'downloads/point/last-week/@coinbase/x402': makeNpm(13547, '@coinbase/x402'),
    })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(['success', 'partial', 'error']).toContain(body.state)
    expect(typeof body.updatedAt).toBe('string')
    expect(body).toHaveProperty('data')
  })

  it('data has openclaw, agentkit, x402, clawHub fields', async () => {
    stubFetch({
      'repos/openclaw/openclaw': makeGithubRepo(327415),
      'repos/coinbase/agentkit': makeGithubRepo(1166),
      'repos/coinbase/x402': makeGithubRepo(5741),
      'downloads/point/last-week/x402': makeNpm(124892, 'x402'),
      'downloads/point/last-week/@coinbase/agentkit': makeNpm(3469, '@coinbase/agentkit'),
      'downloads/point/last-week/@coinbase/x402': makeNpm(13547, '@coinbase/x402'),
    })

    const res = await GET()
    const { data } = await res.json()

    expect(typeof data.openclaw.stars).toBe('number')
    expect(data.openclaw.stars).toBeGreaterThan(0)

    expect(typeof data.agentkit.stars).toBe('number')
    expect(typeof data.agentkit.npmWeekly).toBe('number')

    expect(typeof data.x402.stars).toBe('number')
    expect(typeof data.x402.npmWeekly).toBe('number')
    expect(typeof data.x402.coinbaseX402Weekly).toBe('number')

    expect(typeof data.clawHub.totalSkills).toBe('number')
    expect(Array.isArray(data.clawHub.x402Skills)).toBe(true)
  })

  it('maps GitHub star counts correctly', async () => {
    stubFetch({
      'repos/openclaw/openclaw': makeGithubRepo(327415),
      'repos/coinbase/agentkit': makeGithubRepo(1166),
      'repos/coinbase/x402': makeGithubRepo(5741),
      'downloads/point/last-week/x402': makeNpm(124892, 'x402'),
      'downloads/point/last-week/@coinbase/agentkit': makeNpm(3469, '@coinbase/agentkit'),
      'downloads/point/last-week/@coinbase/x402': makeNpm(13547, '@coinbase/x402'),
    })

    const res = await GET()
    const { data } = await res.json()

    expect(data.openclaw.stars).toBe(327415)
    expect(data.agentkit.stars).toBe(1166)
    expect(data.x402.stars).toBe(5741)
    expect(data.x402.npmWeekly).toBe(124892)
    expect(data.x402.coinbaseX402Weekly).toBe(13547)
    expect(data.agentkit.npmWeekly).toBe(3469)
  })

  it('returns state=partial when some upstreams fail', async () => {
    stubFetch({
      'repos/openclaw/openclaw': makeGithubRepo(327415),
      // agentkit and x402 GitHub fail
      'repos/coinbase/agentkit': { ok: false, json: () => Promise.resolve({}) },
      'repos/coinbase/x402': { ok: false, json: () => Promise.resolve({}) },
      'downloads/point/last-week/x402': makeNpm(124892, 'x402'),
      'downloads/point/last-week/@coinbase/agentkit': makeNpm(3469, '@coinbase/agentkit'),
      'downloads/point/last-week/@coinbase/x402': makeNpm(13547, '@coinbase/x402'),
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
