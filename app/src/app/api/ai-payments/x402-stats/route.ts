import { NextResponse } from 'next/server'

// Static baseline from x402scan.com observation (March 2026)
// Will be replaced by live Basescan USDC Transfer event queries
const STALE_DATA = {
  dailyTxCount: 142,
  dailyVolumeUsdc: 1840.5,
  baseVsSolanaRatio: 0.78,      // ~78% of volume on Base
  activeFacilitators: 5,
  totalEcosystemProjects: 47,   // x402.org/ecosystem count
  cumulativeTxCount: 3210,
}

export async function GET() {
  return NextResponse.json({
    data: STALE_DATA,
    state: 'stale',
    updatedAt: new Date().toISOString(),
  })
}
