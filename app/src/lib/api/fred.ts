const BASE_URL = 'https://api.stlouisfed.org/fred/series/observations'

const FRED_API_KEY = process.env.FRED_API_KEY || 'DEMO_KEY'

interface TreasuryRate {
  date: string
  rate: number
}

interface FredObservation {
  date: string
  value: string
}

interface FredResponse {
  observations: FredObservation[]
}

function parseObservations(observations: FredObservation[]): TreasuryRate[] {
  const rates: TreasuryRate[] = []
  for (const obs of observations) {
    // FRED uses "." to indicate no data for that day (weekends, holidays)
    if (obs.value === '.') continue
    const parsed = parseFloat(obs.value)
    if (isNaN(parsed)) continue
    rates.push({
      date: obs.date,
      rate: parsed / 100, // FRED returns percentage, convert to decimal
    })
  }
  return rates
}

/**
 * Fetch the latest 3-month Treasury bill rate from FRED (DTB3 series)
 */
export async function fetchLatestTreasuryRate(): Promise<TreasuryRate> {
  const params = new URLSearchParams({
    series_id: 'DTB3',
    api_key: FRED_API_KEY,
    file_type: 'json',
    sort_order: 'desc',
    limit: '10', // fetch a few in case the most recent days have "." values
  })

  const res = await fetch(`${BASE_URL}?${params}`, {
    next: { revalidate: 1800 },
  })
  if (!res.ok) throw new Error(`FRED API error: ${res.status}`)

  const data: FredResponse = await res.json()
  const rates = parseObservations(data.observations || [])

  if (rates.length === 0) {
    throw new Error('No valid Treasury rate data from FRED')
  }

  return rates[0]
}

/**
 * Fetch historical 3-month Treasury bill rates from FRED
 */
export async function fetchTreasuryRateHistory(days: number = 90): Promise<TreasuryRate[]> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const params = new URLSearchParams({
    series_id: 'DTB3',
    api_key: FRED_API_KEY,
    file_type: 'json',
    observation_start: startDate.toISOString().split('T')[0],
    observation_end: endDate.toISOString().split('T')[0],
    sort_order: 'asc',
  })

  const res = await fetch(`${BASE_URL}?${params}`, {
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`FRED API error: ${res.status}`)

  const data: FredResponse = await res.json()
  return parseObservations(data.observations || [])
}

// Exported for testing
export { parseObservations }
export type { TreasuryRate, FredObservation, FredResponse }
