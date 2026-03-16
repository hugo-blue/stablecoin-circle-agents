import { describe, it, expect } from 'vitest'
import { ECOSYSTEM_PLAYERS, GENIUS_ACT, STABLECOIN_COMPARISONS } from '@/lib/data/us-stablecoin-ecosystem'

describe('us-stablecoin-ecosystem data integrity', () => {
  describe('ECOSYSTEM_PLAYERS', () => {
    it('has unique ids', () => {
      const ids = ECOSYSTEM_PLAYERS.map(p => p.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('all players have required fields', () => {
      for (const player of ECOSYSTEM_PLAYERS) {
        expect(player.id).toBeTruthy()
        expect(player.name).toBeTruthy()
        expect(['issuer', 'bank', 'card-network', 'fintech', 'exchange']).toContain(player.category)
        expect(['partner', 'competitor', 'both', 'complementary']).toContain(player.circleRelation)
        expect(player.circleRelationDetail).toBeTruthy()
        expect(['positive', 'negative', 'neutral']).toContain(player.geniusActImpact)
        expect(['live', 'early', 'announced']).toContain(player.status)
        expect(player.keyMetric).toBeTruthy()
        expect(player.keyMetricValue).toBeTruthy()
      }
    })

    it('covers all categories', () => {
      const categories = new Set(ECOSYSTEM_PLAYERS.map(p => p.category))
      expect(categories).toContain('issuer')
      expect(categories).toContain('bank')
      expect(categories).toContain('card-network')
      expect(categories).toContain('fintech')
      expect(categories).toContain('exchange')
    })

    it('covers all relation types', () => {
      const relations = new Set(ECOSYSTEM_PLAYERS.map(p => p.circleRelation))
      expect(relations).toContain('partner')
      expect(relations).toContain('competitor')
      expect(relations).toContain('both')
      expect(relations).toContain('complementary')
    })

    it('has Circle/USDC as a player', () => {
      const circle = ECOSYSTEM_PLAYERS.find(p => p.id === 'circle-usdc')
      expect(circle).toBeDefined()
      expect(circle!.category).toBe('issuer')
    })

    it('has at least 10 players', () => {
      expect(ECOSYSTEM_PLAYERS.length).toBeGreaterThanOrEqual(10)
    })

    it('players with marketCapUsd have positive values', () => {
      for (const player of ECOSYSTEM_PLAYERS) {
        if (player.marketCapUsd !== undefined) {
          expect(player.marketCapUsd).toBeGreaterThan(0)
        }
      }
    })
  })

  describe('GENIUS_ACT', () => {
    it('has valid dates', () => {
      expect(GENIUS_ACT.signedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(GENIUS_ACT.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('effective date is after signed date', () => {
      expect(GENIUS_ACT.effectiveDate > GENIUS_ACT.signedDate).toBe(true)
    })

    it('has key provisions', () => {
      expect(GENIUS_ACT.keyProvisions.length).toBeGreaterThan(0)
    })

    it('has winners and losers', () => {
      expect(GENIUS_ACT.winners.length).toBeGreaterThan(0)
      expect(GENIUS_ACT.losers.length).toBeGreaterThan(0)
    })

    it('winners and losers have name and reason', () => {
      for (const w of GENIUS_ACT.winners) {
        expect(w.name).toBeTruthy()
        expect(w.reason).toBeTruthy()
      }
      for (const l of GENIUS_ACT.losers) {
        expect(l.name).toBeTruthy()
        expect(l.reason).toBeTruthy()
      }
    })
  })

  describe('STABLECOIN_COMPARISONS', () => {
    it('has at least 5 entries', () => {
      expect(STABLECOIN_COMPARISONS.length).toBeGreaterThanOrEqual(5)
    })

    it('all entries have required fields', () => {
      for (const c of STABLECOIN_COMPARISONS) {
        expect(c.name).toBeTruthy()
        expect(c.symbol).toBeTruthy()
        expect(c.marketCap).toBeTruthy()
        expect(c.dailyVolume).toBeTruthy()
        expect(c.supportedChains).toBeTruthy()
        expect(c.complianceStatus).toBeTruthy()
        expect(c.usRegulatoryPosition).toBeTruthy()
        expect(c.keyUseCase).toBeTruthy()
      }
    })

    it('includes USDC', () => {
      const usdc = STABLECOIN_COMPARISONS.find(c => c.symbol === 'USDC')
      expect(usdc).toBeDefined()
    })
  })
})
