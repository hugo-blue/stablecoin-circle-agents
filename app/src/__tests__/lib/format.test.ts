import { describe, it, expect } from 'vitest'
import { formatUSD, formatPercent } from '@/lib/format'

describe('formatUSD', () => {
  it('formats zero', () => {
    expect(formatUSD(0)).toBe('$0.00')
  })

  it('formats small values', () => {
    expect(formatUSD(999)).toBe('$999.00')
  })

  it('formats thousands', () => {
    expect(formatUSD(1_000)).toBe('$1.0K')
  })

  it('formats millions', () => {
    expect(formatUSD(1_234_567)).toBe('$1.23M')
  })

  it('formats billions', () => {
    expect(formatUSD(68_432_000_000)).toBe('$68.43B')
  })

  it('formats trillions', () => {
    expect(formatUSD(1_200_000_000_000)).toBe('$1.20T')
  })

  it('formats negative values with sign before $', () => {
    expect(formatUSD(-1_500_000)).toBe('-$1.50M')
  })

  it('handles NaN gracefully', () => {
    expect(formatUSD(NaN)).toBe('$—')
  })

  it('handles Infinity gracefully', () => {
    expect(formatUSD(Infinity)).toBe('$—')
  })
})

describe('formatPercent', () => {
  it('formats positive with + sign', () => {
    expect(formatPercent(2.3)).toBe('+2.30%')
  })

  it('formats negative', () => {
    expect(formatPercent(-1.5)).toBe('-1.50%')
  })

  it('formats zero without sign', () => {
    expect(formatPercent(0)).toBe('0.00%')
  })

  it('handles NaN', () => {
    expect(formatPercent(NaN)).toBe('—')
  })
})
