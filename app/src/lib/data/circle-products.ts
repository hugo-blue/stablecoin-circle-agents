import type { CCTPMetrics, CPNData, NanopaymentsData, ProductNode } from '@/types'

/**
 * Circle Product Ecosystem - Static/Seed Data
 *
 * Sources:
 * - CCTP: Circle developer docs, Q4 2025 earnings, on-chain data
 * - CPN: Circle press releases, earnings call (Feb 2026)
 * - Nanopayments: Circle blog (March 2026)
 * - Contract addresses: developers.circle.com
 *
 * Last updated: 2026-03-16
 */

export const CCTP_METRICS: CCTPMetrics = {
  cumulativeVolumeUsd: 126_000_000_000,
  q4VolumeUsd: 41_300_000_000,
  totalTransfers: 6_000_000,
  bridgedUsdcPct: 50,
  supportedChains: 17,
  contractAddresses: {
    tokenMessengerV2: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d',
    messageTransmitterV2: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64',
  },
  chainPairs: [
    { source: 'Ethereum', target: 'Base', volumeUsd: 12_400_000_000, txCount: 1_820_000, pctOfTotal: 30.0 },
    { source: 'Ethereum', target: 'Arbitrum', volumeUsd: 8_700_000_000, txCount: 1_240_000, pctOfTotal: 21.1 },
    { source: 'Ethereum', target: 'Solana', volumeUsd: 6_200_000_000, txCount: 680_000, pctOfTotal: 15.0 },
    { source: 'Ethereum', target: 'Polygon', volumeUsd: 4_100_000_000, txCount: 520_000, pctOfTotal: 9.9 },
    { source: 'Base', target: 'Ethereum', volumeUsd: 3_500_000_000, txCount: 480_000, pctOfTotal: 8.5 },
    { source: 'Arbitrum', target: 'Ethereum', volumeUsd: 2_800_000_000, txCount: 360_000, pctOfTotal: 6.8 },
    { source: 'Solana', target: 'Ethereum', volumeUsd: 1_900_000_000, txCount: 210_000, pctOfTotal: 4.6 },
    { source: 'Base', target: 'Arbitrum', volumeUsd: 1_700_000_000, txCount: 190_000, pctOfTotal: 4.1 },
  ],
  quarterly: [
    { period: '2024-Q1', volumeUsd: 5_200_000_000, txCount: 580_000 },
    { period: '2024-Q2', volumeUsd: 7_800_000_000, txCount: 820_000 },
    { period: '2024-Q3', volumeUsd: 9_500_000_000, txCount: 1_050_000 },
    { period: '2024-Q4', volumeUsd: 11_200_000_000, txCount: 1_280_000, yoyGrowth: undefined },
    { period: '2025-Q1', volumeUsd: 18_600_000_000, txCount: 1_520_000 },
    { period: '2025-Q2', volumeUsd: 24_100_000_000, txCount: 1_780_000 },
    { period: '2025-Q3', volumeUsd: 31_800_000_000, txCount: 2_100_000 },
    { period: '2025-Q4', volumeUsd: 41_300_000_000, txCount: 2_520_000, yoyGrowth: 268.8 },
  ],
}

export const CPN_DATA: CPNData = {
  enrolledInstitutions: 55,
  inReviewInstitutions: 74,
  annualizedTpvUsd: 5_700_000_000,
  settlementChains: ['Ethereum', 'Polygon', 'Solana'],
  livePartners: ['Alfred Pay', 'Tazapay', 'RedotPay', 'Conduit'],
  designPartners: [
    'Banco Santander', 'Deutsche Bank', 'Societe Generale',
    'Standard Chartered', 'Flutterwave', 'Coins.ph',
  ],
  status: 'live',
  launchDate: '2025-05',
}

export const NANOPAYMENTS_DATA: NanopaymentsData = {
  supportedChains: 12,
  chainNames: [
    'Arbitrum', 'Arc', 'Avalanche', 'Base', 'Ethereum', 'HyperEVM',
    'Optimism', 'Polygon PoS', 'Sei', 'Sonic', 'Unichain', 'World Chain',
  ],
  launchDate: '2026-03',
  status: 'testnet',
  minPaymentUsd: 0.000001,
  contractAddresses: {
    gatewayWallet: '0x77777777Dcc4d5A8B6E418Fd04D8997ef11000eE',
    gatewayMinter: '0x2222222d7164433c4C09B0b0D809a9b52C04C205',
  },
}

export const PRODUCT_NODES: ProductNode[] = [
  {
    id: 'usdc',
    name: 'USDC',
    nameCn: 'USDC 稳定币',
    layer: 'asset',
    metricLabel: '流通量',
    metricValue: '$75.3B',
    status: 'live',
  },
  {
    id: 'mint',
    name: 'Circle Mint',
    nameCn: '机构铸造/赎回',
    layer: 'infra',
    metricLabel: 'Q4 铸赎量',
    metricValue: '$163B',
    status: 'live',
  },
  {
    id: 'cctp',
    name: 'CCTP v2',
    nameCn: '跨链转账协议',
    layer: 'infra',
    metricLabel: '累计交易量',
    metricValue: '$126B',
    status: 'live',
  },
  {
    id: 'gateway',
    name: 'Gateway',
    nameCn: '链抽象层',
    layer: 'infra',
    metricLabel: '支持链数',
    metricValue: '11 chains',
    status: 'live',
  },
  {
    id: 'cpn',
    name: 'CPN',
    nameCn: '机构支付网络',
    layer: 'network',
    metricLabel: '年化 TPV',
    metricValue: '$5.7B',
    status: 'live',
  },
  {
    id: 'arc',
    name: 'Arc',
    nameCn: 'Circle L1 公链',
    layer: 'network',
    metricLabel: '测试网交易',
    metricValue: '166M+',
    status: 'testnet',
  },
  {
    id: 'nanopayments',
    name: 'Nanopayments',
    nameCn: '微支付原语',
    layer: 'application',
    metricLabel: '最小金额',
    metricValue: '$0.000001',
    status: 'testnet',
  },
  {
    id: 'stablefx',
    name: 'StableFX',
    nameCn: '链上外汇',
    layer: 'application',
    metricLabel: '状态',
    metricValue: '测试网',
    status: 'testnet',
  },
]
