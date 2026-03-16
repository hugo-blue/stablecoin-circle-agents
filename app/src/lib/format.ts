/**
 * Format USD values with appropriate suffix (K/M/B/T)
 */
export function formatUSD(value: number): string {
  if (!Number.isFinite(value)) return '$—'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000_000) return `${sign}$${(abs / 1e12).toFixed(2)}T`
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1e9).toFixed(2)}B`
  if (abs >= 1_000_000) return `${sign}$${(abs / 1e6).toFixed(2)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1e3).toFixed(1)}K`
  return `${sign}$${abs.toFixed(2)}`
}

/**
 * Format full USD value for tooltips
 */
export function formatUSDFull(value: number): string {
  if (!Number.isFinite(value)) return '$—'
  const sign = value < 0 ? '-' : ''
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Format percentage with sign
 */
export function formatPercent(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}
