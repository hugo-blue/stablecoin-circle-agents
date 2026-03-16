import { describe, it, expect } from 'vitest'
import {
  calcReserveIncome,
  calcCCTPRevenue,
  calcCPNRevenue,
  calcRateSensitivity,
  calcBreakevenRate,
  Q4_2025_ATTRIBUTION,
  MINT_FEE_SCHEDULE,
} from '@/lib/data/revenue-attribution'

describe('Revenue Attribution Model', () => {
  describe('calcReserveIncome', () => {
    it('calculates Q4 2025 gross reserve income approximately correctly', () => {
      const result = calcReserveIncome({
        avgUsdcCirculation: 76_200_000_000,
        reserveReturnRate: 0.0381,
        coinbaseOnPlatformPct: 0.22,
        days: 91,
      })
      // Q4 actual: $733M, model should be close
      expect(result.grossReserveIncome).toBeGreaterThan(700_000_000)
      expect(result.grossReserveIncome).toBeLessThan(760_000_000)
    })

    it('Coinbase share is always positive', () => {
      const result = calcReserveIncome({
        avgUsdcCirculation: 76_200_000_000,
        reserveReturnRate: 0.0381,
        coinbaseOnPlatformPct: 0.22,
        days: 91,
      })
      expect(result.coinbaseShare).toBeGreaterThan(0)
      expect(result.totalDistribution).toBeGreaterThan(result.coinbaseShare)
    })

    it('net reserve income is less than gross', () => {
      const result = calcReserveIncome({
        avgUsdcCirculation: 76_200_000_000,
        reserveReturnRate: 0.0381,
        coinbaseOnPlatformPct: 0.22,
        days: 91,
      })
      expect(result.netReserveIncome).toBeLessThan(result.grossReserveIncome)
      expect(result.netReserveIncome).toBeGreaterThan(0)
    })
  })

  describe('calcCCTPRevenue', () => {
    it('estimates CCTP revenue in reasonable range', () => {
      const result = calcCCTPRevenue({
        totalVolume: 41_300_000_000,
        fastTransferPct: 0.40,
        avgFastFeeBps: 2.0,
      })
      // Should be in $1-5M range for Q4
      expect(result.estimatedRevenue).toBeGreaterThan(1_000_000)
      expect(result.estimatedRevenue).toBeLessThan(10_000_000)
    })

    it('zero volume yields zero revenue', () => {
      const result = calcCCTPRevenue({ totalVolume: 0, fastTransferPct: 0.5, avgFastFeeBps: 2 })
      expect(result.estimatedRevenue).toBe(0)
    })
  })

  describe('calcCPNRevenue', () => {
    it('estimates CPN revenue at 10bps', () => {
      const result = calcCPNRevenue({ annualizedTpv: 5_700_000_000, avgFeeBps: 10 })
      expect(result.annualRevenue).toBe(5_700_000)
      expect(result.quarterlyRevenue).toBe(1_425_000)
    })
  })

  describe('calcRateSensitivity', () => {
    it('100bps cut reduces net income by ~$297M', () => {
      const result = calcRateSensitivity({
        avgCirculation: 76_200_000_000,
        currentRate: 0.0381,
        rateChangeBps: -100,
        rldcMargin: 0.39,
      })
      expect(result.netAnnualImpact).toBeLessThan(-250_000_000)
      expect(result.netAnnualImpact).toBeGreaterThan(-350_000_000)
    })

    it('rate increase has positive impact', () => {
      const result = calcRateSensitivity({
        avgCirculation: 76_200_000_000,
        currentRate: 0.0381,
        rateChangeBps: 50,
        rldcMargin: 0.39,
      })
      expect(result.netAnnualImpact).toBeGreaterThan(0)
    })
  })

  describe('calcBreakevenRate', () => {
    it('breakeven rate is between 1-3%', () => {
      const result = calcBreakevenRate({
        avgCirculation: 76_200_000_000,
        annualOperatingExpenses: 576_000_000,
        rldcMargin: 0.39,
        otherRevenue: 120_000_000,
      })
      expect(result.breakEvenRatePct).toBeGreaterThan(1.0)
      expect(result.breakEvenRatePct).toBeLessThan(3.0)
    })
  })

  describe('Q4_2025_ATTRIBUTION', () => {
    it('total revenue matches sum of components', () => {
      const { reserveIncome, otherRevenue, totalRevenue } = Q4_2025_ATTRIBUTION
      expect(reserveIncome.gross + otherRevenue.total).toBeCloseTo(totalRevenue, -6)
    })

    it('RLDC margin is positive', () => {
      expect(Q4_2025_ATTRIBUTION.rldcMarginPct).toBeGreaterThan(0)
    })
  })

  describe('MINT_FEE_SCHEDULE', () => {
    it('tiers are ordered by amount', () => {
      for (let i = 1; i < MINT_FEE_SCHEDULE.tiers.length; i++) {
        expect(MINT_FEE_SCHEDULE.tiers[i].minUsd).toBeGreaterThanOrEqual(MINT_FEE_SCHEDULE.tiers[i - 1].maxUsd)
      }
    })

    it('first tier is free', () => {
      expect(MINT_FEE_SCHEDULE.tiers[0].feePct).toBe(0)
    })
  })
})
