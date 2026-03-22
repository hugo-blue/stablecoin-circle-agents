import { NextResponse } from 'next/server'

type DailyDownload = { day: string; downloads: number }
export type WeeklyDownload = { weekStart: string; downloads: number }

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
    startDate.setUTCDate(startDate.getUTCDate() - 7 * 9) // 9 weeks back → guarantees 8 complete weeks
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

export async function GET() {
  const [x402, coinbaseX402, agentkit] = await Promise.all([
    fetchWeeklyHistory('x402'),
    fetchWeeklyHistory('@coinbase/x402'),
    fetchWeeklyHistory('@coinbase/agentkit'),
  ])

  const allNull = x402 === null && coinbaseX402 === null && agentkit === null
  const someNull = x402 === null || coinbaseX402 === null || agentkit === null
  const state = allNull ? 'error' : someNull ? 'partial' : 'success'

  return NextResponse.json({
    data: {
      x402: x402 ?? [],
      coinbaseX402: coinbaseX402 ?? [],
      agentkit: agentkit ?? [],
    },
    state,
  })
}
