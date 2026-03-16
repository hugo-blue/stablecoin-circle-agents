/**
 * On-chain adjusted transfer volume data (seed data)
 *
 * Source: Mizuho Research (analysts Dan Dolev, Alexander Jenkins)
 * "Adjusted" = excludes bot activity, internal transfers, non-economic activity
 *
 * Key finding: USDC surpassed USDT in adjusted on-chain volume for the
 * first time since 2019. The shift became clear in 2025.
 *
 * Last updated: 2026-03-16
 */

export interface OnchainVolumeMonthly {
  month: string
  usdcVolumeUsd: number
  usdtVolumeUsd: number
}

/** Monthly adjusted on-chain transfer volume (estimated from Mizuho data) */
export const ONCHAIN_VOLUME_MONTHLY: OnchainVolumeMonthly[] = [
  // 2025
  { month: '2025-01', usdcVolumeUsd: 1_050_000_000_000, usdtVolumeUsd: 950_000_000_000 },
  { month: '2025-02', usdcVolumeUsd: 1_120_000_000_000, usdtVolumeUsd: 980_000_000_000 },
  { month: '2025-03', usdcVolumeUsd: 1_250_000_000_000, usdtVolumeUsd: 1_020_000_000_000 },
  { month: '2025-04', usdcVolumeUsd: 1_380_000_000_000, usdtVolumeUsd: 1_050_000_000_000 },
  { month: '2025-05', usdcVolumeUsd: 1_450_000_000_000, usdtVolumeUsd: 1_080_000_000_000 },
  { month: '2025-06', usdcVolumeUsd: 1_520_000_000_000, usdtVolumeUsd: 1_100_000_000_000 },
  { month: '2025-07', usdcVolumeUsd: 1_600_000_000_000, usdtVolumeUsd: 1_120_000_000_000 },
  { month: '2025-08', usdcVolumeUsd: 1_650_000_000_000, usdtVolumeUsd: 1_100_000_000_000 },
  { month: '2025-09', usdcVolumeUsd: 1_700_000_000_000, usdtVolumeUsd: 1_080_000_000_000 },
  { month: '2025-10', usdcVolumeUsd: 1_780_000_000_000, usdtVolumeUsd: 1_050_000_000_000 },
  { month: '2025-11', usdcVolumeUsd: 1_850_000_000_000, usdtVolumeUsd: 1_080_000_000_000 },
  { month: '2025-12', usdcVolumeUsd: 1_950_000_000_000, usdtVolumeUsd: 1_100_000_000_000 },
  // 2026
  { month: '2026-01', usdcVolumeUsd: 980_000_000_000, usdtVolumeUsd: 520_000_000_000 },
  { month: '2026-02', usdcVolumeUsd: 1_260_000_000_000, usdtVolumeUsd: 514_000_000_000 },
]

/** Annual summary */
export const ONCHAIN_VOLUME_ANNUAL = {
  2025: {
    usdc: 18_300_000_000_000,
    usdt: 13_200_000_000_000,
    usdcSharePct: 58.1,
  },
  '2026-YTD': {
    usdc: 2_240_000_000_000,
    usdt: 1_034_000_000_000,
    usdcSharePct: 68.4,
  },
}

/** Key drivers of USDC volume growth */
export const VOLUME_DRIVERS = [
  { factor: 'AI Agent 支付', detail: '98.6% 的 AI Agent 支付使用 USDC 结算（1.4亿+ 笔交易）' },
  { factor: 'GENIUS Act', detail: '美国稳定币法案（2025年7月）利好合规发行商' },
  { factor: '企业财务采用', detail: '企业用 USDC 替代传统电汇进行财务管理' },
  { factor: 'Base 链增长', detail: 'Coinbase L2 链上 USDC 活动爆发式增长' },
]
