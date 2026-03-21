import { NextResponse } from 'next/server'

// ClawHub stats — total is from clawhub.ai, x402 skills manually verified
const CLAWHUB_STATIC = {
  totalSkills: 3286,
  x402Skills: ['Messari', 'Breeze'],
}

async function fetchGithubStars(repo: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return typeof data.stargazers_count === 'number' ? data.stargazers_count : null
  } catch {
    return null
  }
}

async function fetchNpmWeekly(pkg: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.npmjs.org/downloads/point/last-week/${pkg}`
    )
    if (!res.ok) return null
    const data = await res.json()
    return typeof data.downloads === 'number' ? data.downloads : null
  } catch {
    return null
  }
}

export async function GET() {
  const [
    openclawStars,
    agentkitStars,
    x402Stars,
    x402Npm,
    coinbaseX402Npm,
    agentkitNpm,
  ] = await Promise.all([
    fetchGithubStars('openclaw/openclaw'),
    fetchGithubStars('coinbase/agentkit'),
    fetchGithubStars('coinbase/x402'),
    fetchNpmWeekly('x402'),
    fetchNpmWeekly('@coinbase/x402'),
    fetchNpmWeekly('@coinbase/agentkit'),
  ])

  const allNull = [openclawStars, agentkitStars, x402Stars, x402Npm].every(v => v === null)
  const someNull = [openclawStars, agentkitStars, x402Stars].some(v => v === null)

  const state = allNull ? 'error' : someNull ? 'partial' : 'success'

  return NextResponse.json({
    data: {
      openclaw: {
        stars: openclawStars,
      },
      agentkit: {
        stars: agentkitStars,
        npmWeekly: agentkitNpm,
      },
      x402: {
        stars: x402Stars,
        npmWeekly: x402Npm,
        coinbaseX402Weekly: coinbaseX402Npm,
      },
      clawHub: CLAWHUB_STATIC,
    },
    state,
    updatedAt: new Date().toISOString(),
  })
}
