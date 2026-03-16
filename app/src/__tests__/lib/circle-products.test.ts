import { describe, it, expect } from 'vitest'
import { CCTP_METRICS, CPN_DATA, NANOPAYMENTS_DATA, PRODUCT_NODES } from '@/lib/data/circle-products'

describe('circle-products data integrity', () => {
  describe('CCTP_METRICS', () => {
    it('has positive cumulative volume', () => {
      expect(CCTP_METRICS.cumulativeVolumeUsd).toBeGreaterThan(0)
    })

    it('chain pairs have positive volumes and percentages', () => {
      for (const pair of CCTP_METRICS.chainPairs) {
        expect(pair.volumeUsd).toBeGreaterThan(0)
        expect(pair.txCount).toBeGreaterThan(0)
        expect(pair.pctOfTotal).toBeGreaterThan(0)
        expect(pair.pctOfTotal).toBeLessThanOrEqual(100)
      }
    })

    it('chain pair percentages sum to approximately 100%', () => {
      const sum = CCTP_METRICS.chainPairs.reduce((s, p) => s + p.pctOfTotal, 0)
      expect(sum).toBeGreaterThan(90)
      expect(sum).toBeLessThanOrEqual(100)
    })

    it('quarterly data is chronologically ordered', () => {
      for (let i = 1; i < CCTP_METRICS.quarterly.length; i++) {
        expect(CCTP_METRICS.quarterly[i].period > CCTP_METRICS.quarterly[i - 1].period).toBe(true)
      }
    })

    it('has valid contract addresses (0x + 40 hex chars)', () => {
      expect(CCTP_METRICS.contractAddresses.tokenMessengerV2).toMatch(/^0x[0-9a-fA-F]{40}$/)
      expect(CCTP_METRICS.contractAddresses.messageTransmitterV2).toMatch(/^0x[0-9a-fA-F]{40}$/)
    })
  })

  describe('CPN_DATA', () => {
    it('has positive enrolled institutions', () => {
      expect(CPN_DATA.enrolledInstitutions).toBeGreaterThan(0)
    })

    it('has at least one settlement chain', () => {
      expect(CPN_DATA.settlementChains.length).toBeGreaterThan(0)
    })

    it('has at least one live partner', () => {
      expect(CPN_DATA.livePartners.length).toBeGreaterThan(0)
    })

    it('status is live', () => {
      expect(CPN_DATA.status).toBe('live')
    })
  })

  describe('NANOPAYMENTS_DATA', () => {
    it('is on testnet', () => {
      expect(NANOPAYMENTS_DATA.status).toBe('testnet')
    })

    it('chain count matches chain names array', () => {
      expect(NANOPAYMENTS_DATA.supportedChains).toBe(NANOPAYMENTS_DATA.chainNames.length)
    })

    it('has valid contract addresses', () => {
      expect(NANOPAYMENTS_DATA.contractAddresses.gatewayWallet).toMatch(/^0x[0-9a-fA-F]{40}$/)
      expect(NANOPAYMENTS_DATA.contractAddresses.gatewayMinter).toMatch(/^0x[0-9a-fA-F]{40}$/)
    })

    it('minimum payment is sub-cent', () => {
      expect(NANOPAYMENTS_DATA.minPaymentUsd).toBeLessThan(0.01)
    })
  })

  describe('PRODUCT_NODES', () => {
    it('has unique ids', () => {
      const ids = PRODUCT_NODES.map(n => n.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('all nodes have required fields', () => {
      for (const node of PRODUCT_NODES) {
        expect(node.name).toBeTruthy()
        expect(node.nameCn).toBeTruthy()
        expect(['asset', 'infra', 'network', 'application']).toContain(node.layer)
        expect(['live', 'testnet', 'coming-soon']).toContain(node.status)
      }
    })

    it('covers all four layers', () => {
      const layers = new Set(PRODUCT_NODES.map(n => n.layer))
      expect(layers).toContain('asset')
      expect(layers).toContain('infra')
      expect(layers).toContain('network')
      expect(layers).toContain('application')
    })
  })
})
