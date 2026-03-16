import { describe, it, expect } from 'vitest'
import {
  calcMarketShare,
  estimateInterest,
  parseUsdcAmount,
  detectDepeg,
  detectDepegRecovery,
} from '@/lib/calculations'

describe('calcMarketShare', () => {
  it('calculates basic share', () => {
    expect(calcMarketShare(68_000e9, 200_000e9)).toBe(34.00)
  })

  it('returns 0 for zero market cap', () => {
    expect(calcMarketShare(0, 200_000e9)).toBe(0.00)
  })

  it('returns null for zero total (division by zero)', () => {
    expect(calcMarketShare(100e9, 0)).toBeNull()
  })

  it('returns 100% for single coin', () => {
    expect(calcMarketShare(200_000e9, 200_000e9)).toBe(100.00)
  })
})

describe('estimateInterest', () => {
  it('calculates daily interest', () => {
    const result = estimateInterest(50_000_000_000, 0.0523, 'daily')
    expect(result).toBe(Math.round(50_000_000_000 * 0.0523 / 365))
  })

  it('calculates quarterly interest (91 days)', () => {
    const result = estimateInterest(50_000_000_000, 0.0523, 'quarterly')
    const expected = Math.round(50_000_000_000 * 0.0523 / 365 * 91)
    expect(result).toBe(expected)
  })

  it('returns 0 for zero reserve', () => {
    expect(estimateInterest(0, 0.0523, 'daily')).toBe(0)
  })

  it('returns 0 for zero rate', () => {
    expect(estimateInterest(50_000_000_000, 0, 'daily')).toBe(0)
  })

  it('throws for negative reserve', () => {
    expect(() => estimateInterest(-1, 0.0523, 'daily')).toThrow()
  })
})

describe('parseUsdcAmount', () => {
  it('parses 1 USDC', () => {
    expect(parseUsdcAmount('1000000')).toBe(1.0)
  })

  it('parses small amount', () => {
    expect(parseUsdcAmount('100')).toBeCloseTo(0.0001)
  })

  it('parses zero', () => {
    expect(parseUsdcAmount('0')).toBe(0)
  })

  it('throws on non-numeric', () => {
    expect(() => parseUsdcAmount('abc')).toThrow()
  })

  it('throws on negative', () => {
    expect(() => parseUsdcAmount('-1')).toThrow()
  })
})

describe('detectDepeg', () => {
  it('detects warning level depeg (0.5%-1%)', () => {
    const prices = Array(15).fill(1.006)
    const result = detectDepeg(prices)
    expect(result.triggered).toBe(true)
    expect(result.severity).toBe('warning')
  })

  it('does not trigger when not consecutive', () => {
    const prices = [1.006, 1.006, 1.006, 1.006, 1.006, 1.006, 1.006,
      1.006, 1.006, 1.006, 1.006, 1.006, 1.006, 1.006, 1.000]
    const result = detectDepeg(prices)
    expect(result.triggered).toBe(false)
  })

  it('detects critical level (1%-3%)', () => {
    const prices = Array(15).fill(1.015)
    const result = detectDepeg(prices)
    expect(result.triggered).toBe(true)
    expect(result.severity).toBe('critical')
  })

  it('detects severe level (>3%)', () => {
    const prices = Array(15).fill(1.035)
    const result = detectDepeg(prices)
    expect(result.triggered).toBe(true)
    expect(result.severity).toBe('severe')
  })

  it('returns false for empty array', () => {
    expect(detectDepeg([]).triggered).toBe(false)
  })
})

describe('detectDepegRecovery', () => {
  it('detects recovery when 5 points within ±0.2%', () => {
    const result = detectDepegRecovery([0.998, 0.999, 1.000, 1.001, 1.000])
    expect(result.resolved).toBe(true)
  })

  it('does not resolve when one point outside', () => {
    const result = detectDepegRecovery([0.998, 0.999, 1.000, 1.003, 1.000])
    expect(result.resolved).toBe(false)
  })
})
