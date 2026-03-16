import { describe, it, expect } from 'vitest'
import { ONCHAIN_VOLUME_MONTHLY, ONCHAIN_VOLUME_ANNUAL, VOLUME_DRIVERS } from '@/lib/data/volume-onchain'

describe('volume-onchain data integrity', () => {
  it('monthly data is chronologically ordered', () => {
    for (let i = 1; i < ONCHAIN_VOLUME_MONTHLY.length; i++) {
      expect(ONCHAIN_VOLUME_MONTHLY[i].month > ONCHAIN_VOLUME_MONTHLY[i - 1].month).toBe(true)
    }
  })

  it('all monthly volumes are positive', () => {
    for (const d of ONCHAIN_VOLUME_MONTHLY) {
      expect(d.usdcVolumeUsd).toBeGreaterThan(0)
      expect(d.usdtVolumeUsd).toBeGreaterThan(0)
    }
  })

  it('USDC exceeds USDT in 2025 annual volume', () => {
    const annual = ONCHAIN_VOLUME_ANNUAL[2025]
    expect(annual.usdc).toBeGreaterThan(annual.usdt)
  })

  it('annual USDC share is above 50%', () => {
    expect(ONCHAIN_VOLUME_ANNUAL[2025].usdcSharePct).toBeGreaterThan(50)
  })

  it('has volume drivers', () => {
    expect(VOLUME_DRIVERS.length).toBeGreaterThan(0)
    for (const d of VOLUME_DRIVERS) {
      expect(d.factor).toBeTruthy()
      expect(d.detail).toBeTruthy()
    }
  })
})
