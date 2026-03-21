import { NextResponse } from 'next/server'

// ClawHub stats — total from clawhub.ai, x402 skills manually verified
const CLAWHUB_STATIC = {
  totalSkills: 3286,
  x402Skills: ['Messari', 'Breeze'],
}

async function fetchGithubStars(repo: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) return null
    const data = await res.json()
    return typeof data.stargazers_count === 'number' ? data.stargazers_count : null
  } catch {
    return null
  }
}

async function fetchNpmDownloads(pkg: string, period: 'last-week' | 'last-month'): Promise<number | null> {
  try {
    const res = await fetch(`https://api.npmjs.org/downloads/point/${period}/${pkg}`)
    if (!res.ok) return null
    const data = await res.json()
    return typeof data.downloads === 'number' ? data.downloads : null
  } catch {
    return null
  }
}

// Growth % = (lastWeek vs average of prior 3 weeks)
// priorAvg = (lastMonth - lastWeek) / 3
function calcGrowthPct(lastWeek: number | null, lastMonth: number | null): number | null {
  if (lastWeek === null || lastMonth === null) return null
  const prior3Weeks = lastMonth - lastWeek
  if (prior3Weeks <= 0) return null
  const priorWeekAvg = prior3Weeks / 3
  return Math.round(((lastWeek - priorWeekAvg) / priorWeekAvg) * 100)
}

export async function GET() {
  const [
    openclawStars,
    agentkitStars,
    x402Stars,
    x402Weekly,
    x402Monthly,
    cbX402Weekly,
    cbX402Monthly,
    agentkitWeekly,
    agentkitMonthly,
  ] = await Promise.all([
    fetchGithubStars('openclaw/openclaw'),
    fetchGithubStars('coinbase/agentkit'),
    fetchGithubStars('coinbase/x402'),
    fetchNpmDownloads('x402', 'last-week'),
    fetchNpmDownloads('x402', 'last-month'),
    fetchNpmDownloads('@coinbase/x402', 'last-week'),
    fetchNpmDownloads('@coinbase/x402', 'last-month'),
    fetchNpmDownloads('@coinbase/agentkit', 'last-week'),
    fetchNpmDownloads('@coinbase/agentkit', 'last-month'),
  ])

  const allNull = [openclawStars, agentkitStars, x402Stars, x402Weekly].every(v => v === null)
  const someNull = [openclawStars, agentkitStars, x402Stars].some(v => v === null)
  const state = allNull ? 'error' : someNull ? 'partial' : 'success'

  return NextResponse.json({
    data: {
      openclaw: {
        stars: openclawStars,
      },
      agentkit: {
        stars: agentkitStars,
        npmWeekly: agentkitWeekly,
        npmMonthly: agentkitMonthly,
        npmGrowthPct: calcGrowthPct(agentkitWeekly, agentkitMonthly),
      },
      x402: {
        stars: x402Stars,
        npmWeekly: x402Weekly,
        npmMonthly: x402Monthly,
        npmGrowthPct: calcGrowthPct(x402Weekly, x402Monthly),
        coinbaseX402Weekly: cbX402Weekly,
        coinbaseX402Monthly: cbX402Monthly,
      },
      clawHub: CLAWHUB_STATIC,
    },
    state,
    updatedAt: new Date().toISOString(),
  })
}
