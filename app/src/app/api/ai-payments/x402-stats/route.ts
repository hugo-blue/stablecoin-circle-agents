import { NextResponse } from 'next/server'
import { fetchFacilitatorOnchain } from '@/lib/x402-basescan'

// 每次请求实时执行（否则 App Router 构建时静态缓存 → 冻结在部署时刻）。
export const dynamic = 'force-dynamic'

/**
 * 实时字段来自 Basescan facilitator 链上聚合：
 *   dailyTxCount / x402scanDailyTxCount（近 7 天日均）、cumulativeTxCount（近 30 天窗口口径，
 *   非全时）、activeFacilitators、snapshotDate（今日）。
 *
 * 静态背景字段 Basescan 无法直接给出，标注为「非实时」：
 *   dailyVolumeUsdc（需解码 tokentx）、baseVsSolanaRatio、totalEcosystemProjects、
 *   activeSellers、activeBuyers（买方计数无法从 facilitator tx 得出）、topServer。
 *   这些正是易被高估的「计数器」类数字——真实成交口径见页面「数字可信度」卡。
 *
 * 无 API key 或链上失败时优雅退回静态快照（state: 'stale'）。
 */
const STATIC = {
  dailyTxCount: 65_300,
  dailyVolumeUsdc: 67_400,
  baseVsSolanaRatio: 0.55,
  activeFacilitators: 5,
  totalEcosystemProjects: 47,
  cumulativeTxCount: 75_400_000,
  officialMonthlyTxCount: 75_400_000,
  x402scanDailyTxCount: 65_300,
  x402scanDailyVolumeUsdc: 67_400,
  activeSellers: 834,
  activeBuyers: 3_770,
  topServer: { name: 'Virtuals Protocol', sharePct: 77 },
  snapshotDate: '2026-03-21',
} as const

type Live = { dailyTx: number; cumulative: number; activeFac: number }

function build(live: Live | null) {
  return {
    // ── 实时（Basescan facilitator 链上派生）──
    dailyTxCount: live ? live.dailyTx : STATIC.dailyTxCount,
    x402scanDailyTxCount: live ? live.dailyTx : STATIC.x402scanDailyTxCount,
    cumulativeTxCount: live ? live.cumulative : STATIC.cumulativeTxCount,
    officialMonthlyTxCount: live ? live.cumulative : STATIC.officialMonthlyTxCount,
    activeFacilitators: live ? live.activeFac : STATIC.activeFacilitators,
    snapshotDate: live ? new Date().toISOString().slice(0, 10) : STATIC.snapshotDate,
    windowDays: 30,
    live: !!live,
    // ── 静态背景（非实时，Basescan 无法直接给出）──
    dailyVolumeUsdc: STATIC.dailyVolumeUsdc,
    x402scanDailyVolumeUsdc: STATIC.x402scanDailyVolumeUsdc,
    baseVsSolanaRatio: STATIC.baseVsSolanaRatio,
    totalEcosystemProjects: STATIC.totalEcosystemProjects,
    activeSellers: STATIC.activeSellers,
    activeBuyers: STATIC.activeBuyers,
    topServer: STATIC.topServer,
  }
}

export async function GET() {
  const apiKey = process.env.ETHERSCAN_API_KEY
  if (apiKey) {
    try {
      const oc = await fetchFacilitatorOnchain(apiKey)
      const last7 = oc.dailyTxCounts.slice(-7)
      const dailyTx = last7.length ? Math.round(last7.reduce((s, d) => s + d.txCount, 0) / last7.length) : 0
      const cumulative = oc.dailyTxCounts.reduce((s, d) => s + d.txCount, 0)
      const data = build({ dailyTx, cumulative, activeFac: oc.activeAddresses })
      return NextResponse.json({ state: 'success', data, snapshotDate: data.snapshotDate, updatedAt: new Date().toISOString() })
    } catch {
      // 链上失败 → 退回静态快照
    }
  }
  const data = build(null)
  return NextResponse.json({ state: 'stale', data, snapshotDate: data.snapshotDate, updatedAt: new Date().toISOString() })
}
