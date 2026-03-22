import { NextResponse } from 'next/server'

type DailyDownload = { day: string; downloads: number }
export type WeeklyDownload = { weekStart: string; downloads: number }
export type StarWoW = { lastWeek: number; prevWeek: number } | null

// Returns the ISO date of the Monday of the week containing dateStr (UTC)
function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr)
  const dow = date.getUTCDay() // 0=Sun … 6=Sat
  const diff = dow === 0 ? -6 : 1 - dow
  const monday = new Date(date)
  monday.setUTCDate(date.getUTCDate() + diff)
  return monday.toISOString().slice(0, 10)
}

function aggregateByWeek(daily: DailyDownload[]): WeeklyDownload[] {
  const weeks = new Map<string, number>()
  for (const { day, downloads } of daily) {
    const weekStart = getWeekStart(day)
    weeks.set(weekStart, (weeks.get(weekStart) ?? 0) + downloads)
  }
  return Array.from(weeks.entries())
    .map(([weekStart, downloads]) => ({ weekStart, downloads }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .slice(-8) // keep last 8 complete weeks
}

async function fetchWeeklyHistory(pkg: string): Promise<WeeklyDownload[] | null> {
  try {
    const end = new Date().toISOString().slice(0, 10)
    const startDate = new Date()
    startDate.setUTCDate(startDate.getUTCDate() - 7 * 9)
    const start = startDate.toISOString().slice(0, 10)

    const res = await fetch(`https://api.npmjs.org/downloads/range/${start}:${end}/${pkg}`)
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data.downloads)) return null
    return aggregateByWeek(data.downloads)
  } catch {
    return null
  }
}

// Fetch weekly new-star counts (last 7 days vs 8–14 days ago) using stargazer timestamps
async function fetchStarWoW(owner: string, repo: string): Promise<StarWoW> {
  try {
    // Get total star count to calculate last page
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!repoRes.ok) return null
    const repoData = await repoRes.json()
    const total: number = repoData.stargazers_count ?? 0
    if (total === 0) return { lastWeek: 0, prevWeek: 0 }

    // Fetch last 2 pages (200 most recent stars with timestamps)
    const lastPage = Math.max(1, Math.ceil(total / 100))
    const prevPage = Math.max(1, lastPage - 1)

    const [r1, r2] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}/stargazers?per_page=100&page=${prevPage}`, {
        headers: { Accept: 'application/vnd.github.star+json' },
      }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/stargazers?per_page=100&page=${lastPage}`, {
        headers: { Accept: 'application/vnd.github.star+json' },
      }),
    ])

    const [d1, d2] = await Promise.all([
      r1.ok ? r1.json() : [],
      r2.ok ? r2.json() : [],
    ])

    const all: Array<{ starred_at: string }> = [...d1, ...d2]
    const now = Date.now()
    const DAY = 86_400_000

    const lastWeek = all.filter(s => now - new Date(s.starred_at).getTime() < 7 * DAY).length
    const prevWeek = all.filter(s => {
      const age = now - new Date(s.starred_at).getTime()
      return age >= 7 * DAY && age < 14 * DAY
    }).length

    return { lastWeek, prevWeek }
  } catch {
    return null
  }
}

// ─── 1-hour in-process cache ──────────────────────────────────────────────────

type CacheData = {
  x402: WeeklyDownload[] | null
  coinbaseX402: WeeklyDownload[] | null
  agentkit: WeeklyDownload[] | null
  starWoW: { x402: StarWoW; agentkit: StarWoW; openclaw: StarWoW }
}
let cache: { data: CacheData; updatedAt: number } | null = null
const CACHE_TTL_MS = 60 * 60 * 1_000

export function clearCache() { cache = null }

export async function GET() {
  if (cache && Date.now() - cache.updatedAt < CACHE_TTL_MS) {
    const { x402, coinbaseX402, agentkit, starWoW } = cache.data
    const state = x402 === null && coinbaseX402 === null && agentkit === null ? 'error'
      : x402 === null || coinbaseX402 === null || agentkit === null ? 'partial' : 'success'
    return NextResponse.json({ data: { x402: x402 ?? [], coinbaseX402: coinbaseX402 ?? [], agentkit: agentkit ?? [], starWoW }, state })
  }

  const [x402, coinbaseX402, agentkit, starX402, starAgentkit, starOpenclaw] = await Promise.all([
    fetchWeeklyHistory('x402'),
    fetchWeeklyHistory('@coinbase/x402'),
    fetchWeeklyHistory('@coinbase/agentkit'),
    fetchStarWoW('coinbase', 'x402'),
    fetchStarWoW('coinbase', 'agentkit'),
    fetchStarWoW('openclaw', 'openclaw'),
  ])

  const starWoW = { x402: starX402, agentkit: starAgentkit, openclaw: starOpenclaw }
  const allNull = x402 === null && coinbaseX402 === null && agentkit === null
  const someNull = x402 === null || coinbaseX402 === null || agentkit === null
  const state = allNull ? 'error' : someNull ? 'partial' : 'success'

  cache = { data: { x402, coinbaseX402, agentkit, starWoW }, updatedAt: Date.now() }

  return NextResponse.json({
    data: {
      x402: x402 ?? [],
      coinbaseX402: coinbaseX402 ?? [],
      agentkit: agentkit ?? [],
      starWoW,
    },
    state,
  })
}
