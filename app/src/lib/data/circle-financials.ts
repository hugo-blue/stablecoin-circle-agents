import type { CircleFinancial } from '@/types'

/**
 * Circle Internet Group (NYSE: CRCL) quarterly financial data
 *
 * Sources:
 * - S-1 (filed 2025-04-01): FY2022, FY2023, FY2024 audited + Q1 2025 unaudited
 * - 10-Q (Q2 2025, Q3 2025): SEC EDGAR
 * - 10-K (FY2025): filed 2026-02-25
 *
 * IPO: June 5, 2025 at $31/share on NYSE
 *
 * Coinbase revenue share:
 * - On-platform USDC: Coinbase gets 100% of reserve income
 * - Off-platform USDC: 50/50 split between Circle and Coinbase
 * - 2024: Coinbase received $908M of $1.011B total distribution costs
 *
 * Last updated: 2026-03-15
 */
export const CIRCLE_FINANCIALS: CircleFinancial[] = [
  // --- FY2024 Quarterly (from S-1 prospectus) ---
  {
    period: '2024-Q1', periodType: 'Q',
    revenueUsd: 365_000_000, reserveIncomeUsd: 365_000_000,
    otherRevenueUsd: 0, distributionCostsUsd: 225_000_000,
    coinbaseShareUsd: null, netIncomeUsd: 49_000_000,
    netMarginPct: 13.4, usdcCirculatingUsd: 33_000_000_000,
    source: 'S-1',
  },
  {
    period: '2024-Q2', periodType: 'Q',
    revenueUsd: 430_000_000, reserveIncomeUsd: 430_000_000,
    otherRevenueUsd: 0, distributionCostsUsd: 266_000_000,
    coinbaseShareUsd: null, netIncomeUsd: 33_000_000,
    netMarginPct: 7.7, usdcCirculatingUsd: 33_500_000_000,
    source: 'S-1',
  },
  {
    period: '2024-Q3', periodType: 'Q',
    revenueUsd: 446_000_000, reserveIncomeUsd: 446_000_000,
    otherRevenueUsd: 0, distributionCostsUsd: 259_000_000,
    coinbaseShareUsd: null, netIncomeUsd: 71_000_000,
    netMarginPct: 15.9, usdcCirculatingUsd: 36_000_000_000,
    source: 'S-1',
  },
  {
    period: '2024-Q4', periodType: 'Q',
    revenueUsd: 435_000_000, reserveIncomeUsd: 435_000_000,
    otherRevenueUsd: 0, distributionCostsUsd: 261_000_000,
    coinbaseShareUsd: null, netIncomeUsd: 6_000_000,
    netMarginPct: 1.4, usdcCirculatingUsd: 44_000_000_000,
    source: 'S-1',
  },
  // --- FY2025 Quarterly (from SEC filings) ---
  {
    period: '2025-Q1', periodType: 'Q',
    revenueUsd: 579_000_000, reserveIncomeUsd: 579_000_000,
    otherRevenueUsd: 0, distributionCostsUsd: 358_000_000,
    coinbaseShareUsd: null, netIncomeUsd: 65_000_000,
    netMarginPct: 11.2, usdcCirculatingUsd: 61_000_000_000,
    source: 'S-1',
  },
  {
    period: '2025-Q2', periodType: 'Q',
    revenueUsd: 658_000_000, reserveIncomeUsd: 634_000_000,
    otherRevenueUsd: 24_000_000, distributionCostsUsd: 407_000_000,
    coinbaseShareUsd: null, netIncomeUsd: -482_000_000, // IPO stock-based comp
    netMarginPct: -73.3, usdcCirculatingUsd: 66_000_000_000,
    source: '10-Q',
  },
  {
    period: '2025-Q3', periodType: 'Q',
    revenueUsd: 740_000_000, reserveIncomeUsd: 711_000_000,
    otherRevenueUsd: 29_000_000, distributionCostsUsd: 448_000_000,
    coinbaseShareUsd: null, netIncomeUsd: 214_000_000,
    netMarginPct: 28.9, usdcCirculatingUsd: 73_700_000_000,
    source: '10-Q',
  },
  {
    period: '2025-Q4', periodType: 'Q',
    revenueUsd: 770_000_000, reserveIncomeUsd: 733_000_000,
    otherRevenueUsd: 36_900_000, distributionCostsUsd: 461_000_000,
    coinbaseShareUsd: null, netIncomeUsd: 133_000_000,
    netMarginPct: 17.3, usdcCirculatingUsd: 75_300_000_000,
    source: '10-K',
  },
]

/** Annual summary (from SEC filings) */
export const CIRCLE_ANNUAL = {
  FY2022: { revenue: 772_000_000, distributionCosts: 287_000_000, netIncome: null },
  FY2023: { revenue: 1_450_000_000, distributionCosts: 719_800_000, netIncome: 268_000_000 },
  FY2024: { revenue: 1_680_000_000, distributionCosts: 1_011_000_000, coinbaseShare: 908_000_000, netIncome: 156_000_000 },
  FY2025: { revenue: 2_700_000_000, distributionCosts: 1_674_000_000, netIncome: -70_000_000 },
}

/** Coinbase revenue share model */
export const COINBASE_SHARE_MODEL = {
  description: 'Coinbase gets 100% of reserve income on USDC held on-platform, 50/50 split on off-platform USDC',
  coinbaseUsdcSharePct: {
    2022: 5,
    2023: 12,
    2024: 20,
    2025: 22,
  },
  nextReviewYear: 2026,
}
