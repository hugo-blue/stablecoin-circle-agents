import { NextResponse } from 'next/server'

// Snapshot from x402scan.com + x402.org Facilitator report, 2026-03-21
// Source: x402scan.com independent on-chain index (Base chain USDC transfers via x402 protocol)
const SNAPSHOT = {
  // Legacy fields (API schema compatibility)
  dailyTxCount: 65_300,           // x402scan 24h on-chain verified
  dailyVolumeUsdc: 67_400,        // 24h USDC volume
  baseVsSolanaRatio: 0.95,        // Virtuals Protocol (Base-only) drives ~77% of volume
  activeFacilitators: 5,
  totalEcosystemProjects: 47,     // x402.org/ecosystem count
  cumulativeTxCount: 75_400_000,  // official monthly (x402.org Facilitator report)

  // Snapshot display fields
  snapshotDate: '2026-03-21',
  officialMonthlyTxCount: 75_400_000,   // x402.org Facilitator upper-bound report
  x402scanDailyTxCount: 65_300,
  x402scanDailyVolumeUsdc: 67_400,
  activeSellers: 834,
  activeBuyers: 3_770,
  topServer: { name: 'Virtuals Protocol', sharePct: 77 },
}

export async function GET() {
  return NextResponse.json({
    data: SNAPSHOT,
    state: 'stale',                   // snapshot, not live — awaiting Basescan integration
    snapshotDate: SNAPSHOT.snapshotDate,
    updatedAt: new Date().toISOString(),
  })
}
