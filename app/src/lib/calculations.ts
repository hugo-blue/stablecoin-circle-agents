/**
 * Calculate market share percentage
 */
export function calcMarketShare(marketCap: number, totalMarketCap: number): number | null {
  if (totalMarketCap === 0) return null
  if (marketCap < 0 || totalMarketCap < 0) return null
  return Math.round((marketCap / totalMarketCap) * 10000) / 100
}

/**
 * Estimate interest income from reserves and treasury rate
 * @param reserveUsd - Reserve size in USD
 * @param annualRate - Annual interest rate as decimal (e.g., 0.0523 for 5.23%)
 * @param period - 'daily' or 'quarterly'
 * @param daysInQuarter - Number of days in the quarter (default 91)
 */
export function estimateInterest(
  reserveUsd: number,
  annualRate: number,
  period: 'daily' | 'quarterly',
  daysInQuarter = 91
): number {
  if (reserveUsd < 0) throw new Error('Reserve cannot be negative')
  if (annualRate < 0) throw new Error('Rate cannot be negative')
  if (reserveUsd === 0 || annualRate === 0) return 0

  const dailyInterest = reserveUsd * (annualRate / 365)

  if (period === 'daily') return Math.round(dailyInterest)
  return Math.round(dailyInterest * daysInQuarter)
}

/**
 * Parse USDC on-chain amount (6 decimals) to USD
 */
export function parseUsdcAmount(raw: string): number {
  if (!/^\d+$/.test(raw)) throw new Error(`Invalid USDC amount: ${raw}`)
  return parseInt(raw, 10) / 1_000_000
}

export interface DepegResult {
  triggered: boolean
  severity?: 'warning' | 'critical' | 'severe'
}

/**
 * Detect depeg condition: 15 consecutive price points outside ±0.5% of $1.00
 */
export function detectDepeg(prices: number[]): DepegResult {
  if (prices.length < 15) return { triggered: false }

  // Find any window of 15 consecutive points all outside threshold
  for (let i = 0; i <= prices.length - 15; i++) {
    const window = prices.slice(i, i + 15)
    const allOutside = window.every(p => Math.abs(p - 1.0) > 0.005)
    if (allOutside) {
      // Severity based on max deviation in window
      const maxDeviation = Math.max(...window.map(p => Math.abs(p - 1.0)))
      let severity: 'warning' | 'critical' | 'severe'
      if (maxDeviation > 0.03) severity = 'severe'
      else if (maxDeviation > 0.01) severity = 'critical'
      else severity = 'warning'
      return { triggered: true, severity }
    }
  }

  return { triggered: false }
}

export interface DepegRecoveryResult {
  resolved: boolean
}

/**
 * Detect depeg recovery: 5 consecutive points within ±0.2% of $1.00
 */
export function detectDepegRecovery(prices: number[]): DepegRecoveryResult {
  if (prices.length < 5) return { resolved: false }
  const last5 = prices.slice(-5)
  // Use epsilon for floating point comparison (±0.2% = 0.002)
  const allWithin = last5.every(p => Math.abs(p - 1.0) < 0.002 + 1e-9)
  return { resolved: allWithin }
}
