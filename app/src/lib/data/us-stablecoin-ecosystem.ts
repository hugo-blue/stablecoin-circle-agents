import type { EcosystemPlayer, GeniusActInfo } from '@/types'

/**
 * US Stablecoin Ecosystem - Static Data
 *
 * Sources:
 * - Market caps: CoinGecko / DefiLlama (March 2026)
 * - GENIUS Act: Congress.gov, signed 2025-07-18
 * - Partnership data: Circle SEC filings, press releases
 * - Competitor data: public filings, press releases
 *
 * Last updated: 2026-03-16
 */

export const ECOSYSTEM_PLAYERS: EcosystemPlayer[] = [
  {
    id: 'circle-usdc',
    name: 'Circle / USDC',
    category: 'issuer',
    stablecoin: 'USDC',
    marketCapUsd: 78_000_000_000,
    keyMetric: '市值',
    keyMetricValue: '$78B',
    circleRelation: 'partner',
    circleRelationDetail: '基准 — Circle 自身发行的稳定币',
    geniusActImpact: 'positive',
    status: 'live',
  },
  {
    id: 'tether-usdt',
    name: 'Tether / USDT',
    category: 'issuer',
    stablecoin: 'USDT',
    marketCapUsd: 184_000_000_000,
    keyMetric: '市值',
    keyMetricValue: '$184B',
    circleRelation: 'competitor',
    circleRelationDetail: '最大竞争对手，市占率约 65%。GENIUS Act 合规要求可能迫使 Tether 在美重组',
    geniusActImpact: 'negative',
    status: 'live',
  },
  {
    id: 'tether-usat',
    name: 'Tether / USAT',
    category: 'issuer',
    stablecoin: 'USAT',
    marketCapUsd: 20_000_000,
    keyMetric: '市值',
    keyMetricValue: '~$20M',
    circleRelation: 'competitor',
    circleRelationDetail: 'Tether 针对美国市场推出的合规稳定币，直接挑战 USDC',
    geniusActImpact: 'positive',
    status: 'early',
  },
  {
    id: 'paypal-pyusd',
    name: 'PayPal / PYUSD',
    category: 'fintech',
    stablecoin: 'PYUSD',
    marketCapUsd: 3_900_000_000,
    keyMetric: '市值',
    keyMetricValue: '$3.9B',
    circleRelation: 'competitor',
    circleRelationDetail: 'PayPal 自有稳定币，由 Paxos 发行。依托 PayPal 4 亿用户分发',
    geniusActImpact: 'positive',
    status: 'live',
  },
  {
    id: 'ripple-rlusd',
    name: 'Ripple / RLUSD',
    category: 'issuer',
    stablecoin: 'RLUSD',
    marketCapUsd: 1_300_000_000,
    keyMetric: '市值',
    keyMetricValue: '$1.3B',
    circleRelation: 'competitor',
    circleRelationDetail: 'Ripple 进军稳定币市场，主打跨境支付场景，与 USDC 竞争',
    geniusActImpact: 'positive',
    status: 'live',
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    category: 'exchange',
    keyMetric: '年分润',
    keyMetricValue: '$908M/yr',
    circleRelation: 'partner',
    circleRelationDetail: '最重要合作伙伴。USDC 储备利息分润 $908M/yr，占 Circle 分发成本 ~60%',
    geniusActImpact: 'positive',
    status: 'live',
  },
  {
    id: 'visa',
    name: 'Visa',
    category: 'card-network',
    keyMetric: 'USDC 结算量',
    keyMetricValue: '$3.5B/yr',
    circleRelation: 'partner',
    circleRelationDetail: 'USDC 结算 $3.5B/yr，但已开始支持多稳定币结算',
    geniusActImpact: 'neutral',
    status: 'live',
  },
  {
    id: 'mastercard',
    name: 'Mastercard',
    category: 'card-network',
    keyMetric: 'MTN 支持',
    keyMetricValue: '4 种稳定币',
    circleRelation: 'partner',
    circleRelationDetail: 'MTN 多令牌网络支持 USDC + PYUSD + USDG + FIUSD',
    geniusActImpact: 'neutral',
    status: 'live',
  },
  {
    id: 'stripe-bridge',
    name: 'Stripe / Bridge / Tempo',
    category: 'fintech',
    keyMetric: '支付处理量',
    keyMetricValue: '$1T+ GMV',
    circleRelation: 'both',
    circleRelationDetail: '支持 USDC 支付，但收购 Bridge ($1.1B) 建设竞争性基础设施',
    geniusActImpact: 'positive',
    status: 'live',
  },
  {
    id: 'jpmorgan-kinexys',
    name: 'JPMorgan / Kinexys',
    category: 'bank',
    stablecoin: 'JPM Coin',
    keyMetric: '日结算量',
    keyMetricValue: '$2-3B/day',
    circleRelation: 'complementary',
    circleRelationDetail: 'JPM Coin 封闭网络内结算 $2-3B/day，与公链 USDC 互补',
    geniusActImpact: 'neutral',
    status: 'live',
  },
  {
    id: 'bank-consortium',
    name: '银行联盟稳定币',
    category: 'bank',
    keyMetric: '参与方',
    keyMetricValue: 'JPM+BofA+Citi+WF',
    circleRelation: 'complementary',
    circleRelationDetail: 'JPMorgan、美国银行、花旗、富国银行探索联合发行稳定币',
    geniusActImpact: 'positive',
    status: 'announced',
  },
]

export const GENIUS_ACT: GeniusActInfo = {
  signedDate: '2025-07-18',
  effectiveDate: '2026-11-01',
  keyProvisions: [
    '发行人须持有 1:1 美元或短期国债储备',
    '市值超 $100B 的发行人受美联储直接监管',
    '外国发行人须在美注册实体或获得等效监管认定',
    '月度储备证明 + 年度审计，由注册会计师事务所执行',
    '禁止发行人将储备用于借贷或再质押',
    '消费者资产在发行人破产时享有优先偿付权',
  ],
  winners: [
    { name: 'Circle / USDC', reason: '已符合多数要求，合规成本最低' },
    { name: 'Coinbase', reason: 'USDC 合规优势加强，分润收入更稳定' },
    { name: '美国银行体系', reason: '银行可直接发行稳定币，入场门票' },
    { name: 'PayPal / PYUSD', reason: '已有合规框架，Paxos 受 NYDFS 监管' },
  ],
  losers: [
    { name: 'Tether / USDT', reason: '需在美注册实体或获等效认定，合规成本大增' },
    { name: '算法稳定币', reason: '明确禁止无足额储备的算法稳定币' },
    { name: '离岸小发行人', reason: '合规门槛高，可能被迫退出美国市场' },
  ],
}

/** Comparison table data for stablecoins */
export interface StablecoinComparison {
  name: string
  symbol: string
  marketCap: string
  dailyVolume: string
  supportedChains: string
  complianceStatus: string
  usRegulatoryPosition: string
  keyUseCase: string
}

export const STABLECOIN_COMPARISONS: StablecoinComparison[] = [
  {
    name: 'USDC',
    symbol: 'USDC',
    marketCap: '$78B',
    dailyVolume: '$8-12B',
    supportedChains: '17+ (Ethereum, Solana, Base, Arbitrum...)',
    complianceStatus: '全合规 — 月度储备证明 + SOC 2',
    usRegulatoryPosition: 'GENIUS Act 完全合规',
    keyUseCase: 'DeFi + 机构支付 + 跨境结算',
  },
  {
    name: 'USDT',
    symbol: 'USDT',
    marketCap: '$184B',
    dailyVolume: '$40-60B',
    supportedChains: '15+ (Ethereum, Tron, Solana...)',
    complianceStatus: '季度证明，无完整审计',
    usRegulatoryPosition: '需合规重组或获等效认定',
    keyUseCase: '交易所交易对 + 新兴市场',
  },
  {
    name: 'PYUSD',
    symbol: 'PYUSD',
    marketCap: '$3.9B',
    dailyVolume: '$100-300M',
    supportedChains: '3 (Ethereum, Solana, 计划更多)',
    complianceStatus: 'Paxos 发行，NYDFS 监管',
    usRegulatoryPosition: 'GENIUS Act 合规',
    keyUseCase: 'PayPal 商户支付 + 消费者转账',
  },
  {
    name: 'RLUSD',
    symbol: 'RLUSD',
    marketCap: '$1.3B',
    dailyVolume: '$30-80M',
    supportedChains: '2 (XRP Ledger, Ethereum)',
    complianceStatus: 'NYDFS 批准',
    usRegulatoryPosition: 'GENIUS Act 合规',
    keyUseCase: '跨境支付 + Ripple 生态',
  },
  {
    name: 'USAT',
    symbol: 'USAT',
    marketCap: '~$20M',
    dailyVolume: '<$5M',
    supportedChains: '1 (Ethereum)',
    complianceStatus: '美国实体发行，合规中',
    usRegulatoryPosition: '目标 GENIUS Act 合规',
    keyUseCase: 'Tether 美国市场布局',
  },
  {
    name: 'JPM Coin',
    symbol: 'JPM Coin',
    marketCap: '非公开',
    dailyVolume: '$2-3B (封闭网络)',
    supportedChains: '1 (Kinexys 私有链)',
    complianceStatus: 'OCC 银行监管',
    usRegulatoryPosition: '银行发行，天然合规',
    keyUseCase: '机构间结算 + 内部转账',
  },
]
