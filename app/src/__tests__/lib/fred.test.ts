import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseObservations } from '@/lib/api/fred'
import type { FredObservation } from '@/lib/api/fred'

describe('FRED API client', () => {
  describe('parseObservations', () => {
    it('parses valid FRED observations into rates', () => {
      const observations: FredObservation[] = [
        { date: '2026-03-10', value: '4.22' },
        { date: '2026-03-11', value: '4.18' },
        { date: '2026-03-12', value: '4.15' },
      ]

      const result = parseObservations(observations)

      expect(result).toHaveLength(3)
      expect(result[0].date).toBe('2026-03-10')
      expect(result[0].rate).toBeCloseTo(0.0422, 6)
      expect(result[1].date).toBe('2026-03-11')
      expect(result[1].rate).toBeCloseTo(0.0418, 6)
      expect(result[2].date).toBe('2026-03-12')
      expect(result[2].rate).toBeCloseTo(0.0415, 6)
    })

    it('skips "." values (no data days)', () => {
      const observations: FredObservation[] = [
        { date: '2026-03-08', value: '.' },
        { date: '2026-03-09', value: '.' },
        { date: '2026-03-10', value: '4.22' },
      ]

      const result = parseObservations(observations)

      expect(result).toHaveLength(1)
      expect(result[0].date).toBe('2026-03-10')
      expect(result[0].rate).toBeCloseTo(0.0422, 6)
    })

    it('handles empty observations array', () => {
      const result = parseObservations([])
      expect(result).toEqual([])
    })

    it('skips NaN values gracefully', () => {
      const observations: FredObservation[] = [
        { date: '2026-03-10', value: 'N/A' },
        { date: '2026-03-11', value: '4.18' },
      ]

      const result = parseObservations(observations)

      expect(result).toHaveLength(1)
      expect(result[0].date).toBe('2026-03-11')
      expect(result[0].rate).toBeCloseTo(0.0418, 6)
    })

    it('converts percentage to decimal correctly', () => {
      const observations: FredObservation[] = [
        { date: '2026-03-10', value: '3.81' },
      ]

      const result = parseObservations(observations)

      expect(result[0].rate).toBeCloseTo(0.0381, 6)
    })
  })

  describe('fetchLatestTreasuryRate', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('fetches and returns the latest valid rate', async () => {
      const mockResponse = {
        observations: [
          { date: '2026-03-14', value: '3.81' },
          { date: '2026-03-13', value: '3.82' },
        ],
      }

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }))

      const { fetchLatestTreasuryRate } = await import('@/lib/api/fred')
      const result = await fetchLatestTreasuryRate()

      expect(result).toEqual({ date: '2026-03-14', rate: 0.0381 })
    })

    it('throws on empty valid observations', async () => {
      const mockResponse = {
        observations: [
          { date: '2026-03-14', value: '.' },
          { date: '2026-03-13', value: '.' },
        ],
      }

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }))

      const { fetchLatestTreasuryRate } = await import('@/lib/api/fred')
      await expect(fetchLatestTreasuryRate()).rejects.toThrow('No valid Treasury rate data')
    })

    it('throws on API error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }))

      const { fetchLatestTreasuryRate } = await import('@/lib/api/fred')
      await expect(fetchLatestTreasuryRate()).rejects.toThrow('FRED API error: 500')
    })
  })

  describe('fetchTreasuryRateHistory', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('fetches history and filters dot values', async () => {
      const mockResponse = {
        observations: [
          { date: '2026-03-08', value: '.' },
          { date: '2026-03-09', value: '.' },
          { date: '2026-03-10', value: '4.22' },
          { date: '2026-03-11', value: '4.18' },
        ],
      }

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }))

      const { fetchTreasuryRateHistory } = await import('@/lib/api/fred')
      const result = await fetchTreasuryRateHistory(30)

      expect(result).toHaveLength(2)
      expect(result[0].date).toBe('2026-03-10')
      expect(result[1].date).toBe('2026-03-11')
    })
  })
})
