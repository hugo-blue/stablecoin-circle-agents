export interface StablecoinMarket {
  id: string
  symbol: string
  name: string
  marketCap: number
  price: number
  priceChange24h: number
  circulatingSupply: number
}

export interface ChainDistribution {
  chain: string
  symbol: string
  supplyUsd: number
  pctOfTotal: number
}

export interface MintBurnFlow {
  date: string
  symbol: string
  mintedUsd: number
  burnedUsd: number
  netFlowUsd: number
}

/** Combined daily net flows across multiple stablecoins */
export interface MultiCoinFlow {
  date: string
  USDT: number
  USDC: number
  DAI: number
  FDUSD: number
  [key: string]: number | string
}

export interface MarketSharePoint {
  date: string
  [symbol: string]: number | string
}

export type DataState = 'loading' | 'success' | 'error' | 'stale'

export interface ApiResponse<T> {
  data: T | null
  state: DataState
  updatedAt: string | null
  error?: string
}

export interface NewsItem {
  id: string
  title: string
  summaryAi: string | null
  sourceUrl: string
  tags: string[]
  severity: 'high' | 'positive' | 'medium' | 'low'
  publishedAt: string
}

// --- Stablecoin Volume Types ---

export interface VolumeDataPoint {
  date: string
  volume: number
}

export interface StablecoinVolume {
  symbol: string
  volumes: VolumeDataPoint[]
}

// --- M3.3 Circle Product Ecosystem Types ---

export interface CCTPChainPair {
  source: string
  target: string
  volumeUsd: number
  txCount: number
  pctOfTotal: number
}

export interface CCTPQuarterly {
  period: string
  volumeUsd: number
  txCount: number
  yoyGrowth?: number
}

export interface CCTPMetrics {
  cumulativeVolumeUsd: number
  q4VolumeUsd: number
  totalTransfers: number
  bridgedUsdcPct: number
  chainPairs: CCTPChainPair[]
  quarterly: CCTPQuarterly[]
  supportedChains: number
  contractAddresses: {
    tokenMessengerV2: string
    messageTransmitterV2: string
  }
}

export interface CPNData {
  enrolledInstitutions: number
  inReviewInstitutions: number
  annualizedTpvUsd: number
  settlementChains: string[]
  livePartners: string[]
  designPartners: string[]
  status: 'live' | 'pilot' | 'announced'
  launchDate: string
}

export interface NanopaymentsData {
  supportedChains: number
  chainNames: string[]
  launchDate: string
  status: 'testnet' | 'mainnet' | 'announced'
  minPaymentUsd: number
  contractAddresses: {
    gatewayWallet: string
    gatewayMinter: string
  }
}

export interface ProductNode {
  id: string
  name: string
  nameCn: string
  layer: 'asset' | 'infra' | 'network' | 'application'
  metricLabel: string
  metricValue: string
  status: 'live' | 'testnet' | 'coming-soon'
}

// --- US Stablecoin Ecosystem Types ---

export interface EcosystemPlayer {
  id: string
  name: string
  category: 'issuer' | 'bank' | 'card-network' | 'fintech' | 'exchange'
  stablecoin?: string
  marketCapUsd?: number
  keyMetric: string
  keyMetricValue: string
  circleRelation: 'partner' | 'competitor' | 'both' | 'complementary'
  circleRelationDetail: string
  geniusActImpact: 'positive' | 'negative' | 'neutral'
  status: 'live' | 'early' | 'announced'
}

export interface GeniusActInfo {
  signedDate: string
  effectiveDate: string
  keyProvisions: string[]
  winners: { name: string; reason: string }[]
  losers: { name: string; reason: string }[]
}

export interface CircleFinancial {
  period: string       // e.g. "2024-Q1", "2024-FY"
  periodType: 'Q' | 'Y'
  revenueUsd: number
  reserveIncomeUsd: number       // interest on USDC reserves
  otherRevenueUsd: number        // transaction/service fees
  distributionCostsUsd: number   // total distribution costs (incl. Coinbase share)
  coinbaseShareUsd: number | null // Coinbase revenue share (null if not disclosed)
  netIncomeUsd: number
  netMarginPct: number
  usdcCirculatingUsd: number     // USDC in circulation (end of period)
  source: 'S-1' | '10-Q' | '10-K' | 'estimated'  // data provenance
}
