/**
 * Circle Revenue Attribution Model
 *
 * Comprehensive model for estimating Circle's revenue by product line.
 * Built from SEC filings (S-1, 10-K FY2025, 10-Q), earnings calls,
 * and public fee schedules.
 *
 * Sources:
 * - 10-K FY2025 (filed 2026-02-25)
 * - Q4 2025 earnings call transcript (2026-02-25)
 * - S-1/A (filed 2025-05)
 * - Circle developer docs (CCTP fee schedule)
 * - Circle Help Center (Mint fee schedule)
 *
 * Last updated: 2026-03-16
 */

// =============================================================================
// 1. RESERVE INCOME MODEL
// =============================================================================

export interface ReserveIncomeParams {
  /** Average USDC in circulation for the period (USD) */
  avgUsdcCirculation: number
  /** Annualized reserve return rate (decimal, e.g. 0.0381 for 3.81%) */
  reserveReturnRate: number
  /** Coinbase on-platform USDC as % of total (decimal, e.g. 0.22) */
  coinbaseOnPlatformPct: number
  /** Days in period (91 for quarter, 365 for year) */
  days: number
}

/**
 * Coinbase Revenue Share Structure (from S-1, 3-year agreement through 2026):
 *
 * 1. "Party-Product Slice": Coinbase gets 100% of reserve income on USDC
 *    held directly on Coinbase platform (~22% of total USDC in 2025)
 * 2. "Ecosystem Slice": Remaining 50/50 split on off-platform USDC
 *
 * Formula:
 *   grossReserveIncome = avgCirculation * reserveRate * (days/365)
 *   coinbaseShare = (onPlatformPct * grossReserveIncome * 1.0)
 *                 + ((1 - onPlatformPct) * grossReserveIncome * 0.50)
 *   netReserveIncome = grossReserveIncome - coinbaseShare - otherDistribution
 *
 * Historical Coinbase share of total distribution costs:
 *   2024: $908M of $1,011M = 89.8%
 *   (Binance, ByBit, and other partners share the remainder)
 */
export const COINBASE_SHARE_TERMS = {
  onPlatformRate: 1.0,     // 100% of reserve income on USDC held on Coinbase
  offPlatformRate: 0.50,   // 50% of reserve income on off-platform USDC
  agreementExpiry: 2026,   // 3-year agreement, next review 2026
  coinbasePctOfDistCosts2024: 0.898, // $908M / $1,011M
}

/**
 * Reserve return rates by quarter (from earnings releases)
 */
export const RESERVE_RETURN_RATES: Record<string, number> = {
  '2024-Q4': 0.0449,
  '2025-Q1': 0.0433,  // estimated from S-1 disclosure
  '2025-Q2': 0.0415,  // estimated
  '2025-Q3': 0.0415,  // 10-Q: "4.15% reserve return rate"
  '2025-Q4': 0.0381,  // 10-K: "3.81%, down 68bps YoY"
}

/**
 * Calculate gross and net reserve income
 */
export function calcReserveIncome(params: ReserveIncomeParams) {
  const { avgUsdcCirculation, reserveReturnRate, coinbaseOnPlatformPct, days } = params

  const grossReserveIncome = avgUsdcCirculation * reserveReturnRate * (days / 365)

  // Coinbase share calculation
  const onPlatformIncome = grossReserveIncome * coinbaseOnPlatformPct
  const offPlatformIncome = grossReserveIncome * (1 - coinbaseOnPlatformPct)
  const coinbaseShare = (onPlatformIncome * COINBASE_SHARE_TERMS.onPlatformRate)
    + (offPlatformIncome * COINBASE_SHARE_TERMS.offPlatformRate)

  // Other distribution partners (~10% of total distribution in 2024)
  const otherDistributionPct = 1 - COINBASE_SHARE_TERMS.coinbasePctOfDistCosts2024
  const totalDistribution = coinbaseShare / COINBASE_SHARE_TERMS.coinbasePctOfDistCosts2024
  const otherDistribution = totalDistribution * otherDistributionPct

  const netReserveIncome = grossReserveIncome - totalDistribution
  const distributionMarginPct = 1 - (totalDistribution / grossReserveIncome)

  return {
    grossReserveIncome: Math.round(grossReserveIncome),
    coinbaseShare: Math.round(coinbaseShare),
    otherDistribution: Math.round(otherDistribution),
    totalDistribution: Math.round(totalDistribution),
    netReserveIncome: Math.round(netReserveIncome),
    distributionMarginPct: Math.round(distributionMarginPct * 1000) / 10, // e.g. 37.0%
  }
}

// =============================================================================
// 2. CCTP REVENUE MODEL
// =============================================================================

/**
 * CCTP V2 Fee Structure:
 *
 * - Standard Transfer: 0 fee (waits for full finality)
 * - Fast Transfer: Variable basis-point fee, charged onchain at mint
 *   - Fees are finality-indexed: chains with slower finality = higher fees
 *   - Fee retrieved via API: /v2/burn/USDC/fees (dynamic, per-chain)
 *   - Estimated range: 1-4 bps based on chain risk profile
 *   - Arbitrum/Base (fast finality): ~1 bps
 *   - Ethereum mainnet: ~2-4 bps
 *   - Higher-risk chains: up to ~4+ bps
 *
 * Revenue attribution:
 *   CCTP fees are part of "transaction revenue" ($12.2M in Q4 2025)
 *   Q4 transaction revenue also includes $7M Canton Coin trading benefit
 *   Implies CCTP + other transaction fees = ~$5.2M in Q4
 *
 * Note: Exact per-chain fees are dynamic and not publicly disclosed in
 * fixed schedules. The estimates below are based on observed ranges.
 */
export interface CCTPRevenueParams {
  /** Total CCTP volume for period (USD) */
  totalVolume: number
  /** Estimated % of volume using Fast Transfer (vs Standard) */
  fastTransferPct: number
  /** Average fee in basis points for Fast Transfers */
  avgFastFeeBps: number
}

export const CCTP_FEE_ESTIMATES = {
  // Estimated fee ranges by chain (basis points)
  chainFees: {
    arbitrum: { minBps: 1, maxBps: 2 },
    base: { minBps: 1, maxBps: 2 },
    ethereum: { minBps: 2, maxBps: 4 },
    solana: { minBps: 1, maxBps: 3 },
    polygon: { minBps: 1, maxBps: 3 },
    other: { minBps: 2, maxBps: 4 },
  },
  // Standard transfer fee is 0
  standardFeeBps: 0,
  // Market share: CCTP reached 62% of all bridge volume in Jan 2026
  bridgeMarketSharePct: 62,
}

export function calcCCTPRevenue(params: CCTPRevenueParams) {
  const { totalVolume, fastTransferPct, avgFastFeeBps } = params

  const fastVolume = totalVolume * fastTransferPct
  const feeRevenue = fastVolume * (avgFastFeeBps / 10_000)

  return {
    totalVolume,
    fastVolume: Math.round(fastVolume),
    standardVolume: Math.round(totalVolume - fastVolume),
    estimatedRevenue: Math.round(feeRevenue),
    impliedTakeRate: avgFastFeeBps * fastTransferPct, // effective bps on total volume
  }
}

// =============================================================================
// 3. CPN REVENUE MODEL
// =============================================================================

/**
 * Circle Payments Network Fee Structure:
 *
 * - Variable basis-point fees, tiered by country group
 * - Exact tiers NOT publicly disclosed
 * - Plus blockchain gas fees (pass-through)
 *
 * Comparable payment network fees for modeling:
 *   - SWIFT: $15-50 per wire (flat fee model)
 *   - Card networks (Visa/MC): 1-3% of transaction value
 *   - Wise (cross-border): 0.35-2.0% depending on corridor
 *   - Ripple/ODL: ~0.1-0.5% estimated
 *   - Circle CPN likely: 5-20 bps (competitive with crypto rails)
 *
 * Key data:
 *   - Annualized TPV: $5.7B (as of Feb 2026, trailing 30 days)
 *   - 55 enrolled institutions, 74 under review
 *   - Q3->Q4 volume growth: +68%
 *   - FY2026 "other revenue" guidance: $150-170M (includes CPN + CCTP + other)
 */
export interface CPNRevenueParams {
  /** Annualized transaction payment volume (USD) */
  annualizedTpv: number
  /** Estimated average fee in basis points */
  avgFeeBps: number
}

export const CPN_FEE_ESTIMATES = {
  // Country group tiers (estimated ranges)
  tierEstimates: {
    tier1_developed: { minBps: 3, maxBps: 8 },     // US, EU, UK, Japan
    tier2_emerging: { minBps: 8, maxBps: 15 },      // LatAm, SE Asia
    tier3_frontier: { minBps: 15, maxBps: 25 },     // Africa, etc.
  },
  // Blended estimate across corridors
  blendedEstimateBps: { low: 5, mid: 10, high: 20 },
}

export function calcCPNRevenue(params: CPNRevenueParams) {
  const { annualizedTpv, avgFeeBps } = params
  const annualRevenue = annualizedTpv * (avgFeeBps / 10_000)

  return {
    annualizedTpv,
    avgFeeBps,
    annualRevenue: Math.round(annualRevenue),
    quarterlyRevenue: Math.round(annualRevenue / 4),
  }
}

// =============================================================================
// 4. CIRCLE MINT REVENUE MODEL
// =============================================================================

/**
 * Circle Mint Fast Redemption Fee Schedule (as of Oct 2024):
 *
 * | Tier                  | Fee Rate | Processing   |
 * |-----------------------|----------|--------------|
 * | ≤ $2M / day           | 0.00%   | Near-instant |
 * | $2M - $5M / day       | 0.03%   | Near-instant |
 * | $5M - $15M / day      | 0.06%   | Near-instant |
 * | > $15M / day          | 0.10%   | Near-instant |
 * | Basic (any amount)    | 0.00%   | 1-2 biz days |
 *
 * Key data:
 *   - Q4 2025 mint+redeem volume: $163B
 *   - Fast redemption fees are part of "transaction revenue"
 *   - Most institutional volume likely uses basic (free) redemption
 *   - Arbitrage/trading firms more likely to use fast redemption
 */
export interface MintRevenueParams {
  /** Total redemption volume for period (USD) */
  totalRedemptionVolume: number
  /** % of volume using fast (instant) redemption */
  fastRedemptionPct: number
  /** Distribution of fast redemption volume across tiers */
  tierDistribution: {
    under2m: number   // % of fast volume
    from2mTo5m: number
    from5mTo15m: number
    over15m: number
  }
}

export const MINT_FEE_SCHEDULE = {
  tiers: [
    { label: '≤ $2M/day', minUsd: 0, maxUsd: 2_000_000, feePct: 0.0000 },
    { label: '$2M-$5M/day', minUsd: 2_000_000, maxUsd: 5_000_000, feePct: 0.0003 },
    { label: '$5M-$15M/day', minUsd: 5_000_000, maxUsd: 15_000_000, feePct: 0.0006 },
    { label: '> $15M/day', minUsd: 15_000_000, maxUsd: Infinity, feePct: 0.0010 },
  ],
  basicRedemptionFee: 0.0000,  // Free but takes 1-2 business days
  basicProcessingDays: 2,
}

export function calcMintRevenue(params: MintRevenueParams) {
  const { totalRedemptionVolume, fastRedemptionPct, tierDistribution } = params

  const fastVolume = totalRedemptionVolume * fastRedemptionPct
  const revenue =
    fastVolume * tierDistribution.under2m * MINT_FEE_SCHEDULE.tiers[0].feePct +
    fastVolume * tierDistribution.from2mTo5m * MINT_FEE_SCHEDULE.tiers[1].feePct +
    fastVolume * tierDistribution.from5mTo15m * MINT_FEE_SCHEDULE.tiers[2].feePct +
    fastVolume * tierDistribution.over15m * MINT_FEE_SCHEDULE.tiers[3].feePct

  return {
    totalRedemptionVolume,
    fastVolume: Math.round(fastVolume),
    estimatedRevenue: Math.round(revenue),
    effectiveTakeRate: totalRedemptionVolume > 0
      ? Math.round((revenue / totalRedemptionVolume) * 100_000) / 100_000
      : 0,
  }
}

// =============================================================================
// 5. "OTHER REVENUE" BREAKDOWN
// =============================================================================

/**
 * Q4 2025 Other Revenue: $36.9M total
 *
 * A. Subscription & Services Revenue: $24.7M
 *    - Blockchain network partnership fees (majority)
 *      = Fees from L1/L2 chains for native USDC deployment
 *      = e.g., Solana, Base, Arbitrum, Polygon pay Circle for USDC integration
 *    - USYC (yield-bearing stablecoin) asset management fees
 *      = $1.5B AUM, "relatively small today" per earnings call
 *    - Circle Mint subscription/platform fees
 *
 * B. Transaction Revenue: $12.2M
 *    - CCTP Fast Transfer fees
 *    - Circle Mint fast redemption fees
 *    - Canton Coin trading: ~$7M one-time benefit in Q4
 *    - CPN transaction fees (small, early-stage)
 *    - USYC redemption fees
 *
 * FY2026 Guidance: $150-170M total other revenue (3-4x FY2025 run rate)
 */
export const OTHER_REVENUE_BREAKDOWN_Q4_2025 = {
  total: 36_900_000,
  subscription: {
    total: 24_700_000,
    components: {
      blockchainPartnershipFees: 20_000_000,  // estimated majority
      usycManagementFees: 2_000_000,          // "relatively small"
      mintPlatformFees: 2_700_000,            // estimated remainder
    },
  },
  transaction: {
    total: 12_200_000,
    components: {
      cantonCoinTrading: 7_000_000,           // disclosed one-time
      cctpFastTransferFees: 3_000_000,        // estimated
      mintFastRedemptionFees: 1_200_000,      // estimated
      cpnTransactionFees: 500_000,            // early stage
      otherTransactionFees: 500_000,          // estimated remainder
    },
  },
  fy2026Guidance: { low: 150_000_000, high: 170_000_000 },
}

// =============================================================================
// 6. RATE SENSITIVITY MODEL
// =============================================================================

/**
 * Rate Sensitivity Analysis
 *
 * Circle's reserve income is directly tied to short-term Treasury yields
 * (tracking SOFR). Key relationships:
 *
 * Per 100bps rate change impact (at current ~$76B avg circulation):
 *   Gross impact: $76B * 0.01 = $760M annual revenue change
 *   After Coinbase (~61% distribution): ~$296M net revenue change
 *
 * From Circle's own disclosures and analyst estimates:
 *   - S-1 estimate: 100bps cut = -$441M gross (at $44B avg circ, Dec 2024 rates)
 *   - Q3 2025 estimate: 100bps cut = -$618M gross (at ~$62B avg circ)
 *   - Q4 2025 estimate: 100bps cut = -$762M gross (at ~$76B avg circ)
 *
 * Breakeven analysis:
 *   FY2025 adj. opex: ~$576M ($144M * 4 quarters)
 *   Required net revenue to break even: ~$576M
 *   At 39% RLDC margin: need ~$1,477M gross reserve income
 *   At $76B circulation: need ~1.94% reserve return rate
 *   => Implies breakeven fed funds rate of ~2.0-2.5% (accounting for
 *      T-bill spread below fed funds)
 *
 * To offset a 25bps cut: need ~$3.7B additional USDC circulation (~6% growth)
 */
export interface RateSensitivityParams {
  /** Average USDC in circulation (USD) */
  avgCirculation: number
  /** Current reserve return rate (decimal) */
  currentRate: number
  /** Rate change in basis points (negative = cut) */
  rateChangeBps: number
  /** Revenue Less Distribution Cost margin (decimal, e.g. 0.39) */
  rldcMargin: number
}

export function calcRateSensitivity(params: RateSensitivityParams) {
  const { avgCirculation, currentRate, rateChangeBps, rldcMargin } = params

  const rateChange = rateChangeBps / 10_000
  const newRate = currentRate + rateChange

  const currentGrossAnnual = avgCirculation * currentRate
  const newGrossAnnual = avgCirculation * Math.max(0, newRate)
  const grossImpact = newGrossAnnual - currentGrossAnnual
  const netImpact = grossImpact * rldcMargin

  // USDC growth needed to offset rate change
  const circulationToOffset = Math.abs(grossImpact) / Math.max(0.001, newRate)
  const growthPctToOffset = circulationToOffset / avgCirculation

  return {
    currentRate,
    newRate: Math.max(0, newRate),
    grossAnnualImpact: Math.round(grossImpact),
    netAnnualImpact: Math.round(netImpact),
    grossQuarterlyImpact: Math.round(grossImpact / 4),
    netQuarterlyImpact: Math.round(netImpact / 4),
    circulationToOffset: Math.round(circulationToOffset),
    growthPctToOffset: Math.round(growthPctToOffset * 1000) / 10,
  }
}

/**
 * Calculate the minimum reserve return rate needed to break even
 */
export function calcBreakevenRate(params: {
  avgCirculation: number
  annualOperatingExpenses: number
  rldcMargin: number
  otherRevenue: number
}) {
  const { avgCirculation, annualOperatingExpenses, rldcMargin, otherRevenue } = params

  // Net reserve income needed = opex - other revenue
  const netReserveIncomeNeeded = Math.max(0, annualOperatingExpenses - otherRevenue)
  // Gross reserve income needed = net / RLDC margin
  const grossReserveIncomeNeeded = netReserveIncomeNeeded / rldcMargin
  // Rate needed = gross income / circulation
  const rateNeeded = grossReserveIncomeNeeded / avgCirculation

  return {
    netReserveIncomeNeeded: Math.round(netReserveIncomeNeeded),
    grossReserveIncomeNeeded: Math.round(grossReserveIncomeNeeded),
    breakEvenRatePct: Math.round(rateNeeded * 10000) / 100,
    breakEvenRateBps: Math.round(rateNeeded * 10000),
  }
}

// =============================================================================
// 7. LIVE RESERVE INCOME (DYNAMIC RATE)
// =============================================================================

/**
 * Calculate reserve income using a live Treasury rate and current USDC circulation.
 * Uses the Q4 2025 actual distribution percentage as the default.
 */
export function calcLiveReserveIncome(usdcCirculation: number, treasuryRate: number, days: number = 91) {
  const gross = usdcCirculation * treasuryRate * (days / 365)
  const distributionPct = 0.629 // Q4 2025 actual
  const distribution = gross * distributionPct
  return {
    gross: Math.round(gross),
    distribution: Math.round(distribution),
    net: Math.round(gross - distribution),
    rate: treasuryRate,
  }
}

// =============================================================================
// 8. FULL REVENUE ATTRIBUTION (Q4 2025 ACTUALS + MODEL)
// =============================================================================

/**
 * Q4 2025 Revenue Attribution Summary
 *
 * Total Revenue: $770.0M
 *   Reserve Income: $733.0M (95.2%)
 *     - Gross reserve income: $733.0M
 *     - Reserve return rate: 3.81%
 *     - Avg USDC circulation: $76.2B
 *     - Distribution costs: $461.0M (62.9% of reserve income)
 *     - Net reserve income: $272.0M
 *
 *   Other Revenue: $36.9M (4.8%)
 *     - Subscription/services: $24.7M (3.2%)
 *     - Transaction revenue: $12.2M (1.6%)
 *
 * RLDC Margin: 40.1% (Q4), ~38% (FY2025)
 * Adjusted EBITDA: $167M (Q4), $582M (FY2025)
 */
export const Q4_2025_ATTRIBUTION = {
  totalRevenue: 770_000_000,
  reserveIncome: {
    gross: 733_000_000,
    returnRate: 0.0381,
    avgCirculation: 76_200_000_000,
    distributionCosts: 461_000_000,
    distributionPctOfReserve: 62.9,
    net: 272_000_000,
  },
  otherRevenue: {
    total: 36_900_000,
    subscriptionServices: 24_700_000,
    transactionRevenue: 12_200_000,
  },
  rldcMarginPct: 40.1,
  adjustedEbitda: 167_000_000,
  // Product volume metrics (not directly revenue)
  productVolumes: {
    cctpVolume: 41_300_000_000,
    cctpBridgeMarketShare: 62,
    cpnAnnualizedTpv: 5_700_000_000,
    mintRedeemVolume: 163_000_000_000,
    onchainTxVolume: 11_900_000_000_000,
  },
}
