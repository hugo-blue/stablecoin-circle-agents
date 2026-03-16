import { describe, it, expect } from 'vitest'
import {
  normalizeUrl,
  jaccardSimilarity,
  isDuplicate,
  classifyTags,
  classifySeverity,
} from '@/lib/news'

describe('normalizeUrl', () => {
  it('strips tracking params', () => {
    expect(normalizeUrl('https://coindesk.com/a?ref=t'))
      .toBe('https://coindesk.com/a')
  })

  it('strips utm params', () => {
    expect(normalizeUrl('https://example.com/page?utm_source=twitter&foo=bar'))
      .toBe('https://example.com/page?foo=bar')
  })
})

describe('jaccardSimilarity', () => {
  it('returns 1.0 for identical texts', () => {
    expect(jaccardSimilarity('usdc circle launch', 'circle usdc launch')).toBe(1.0)
  })

  it('returns 0 for completely different texts', () => {
    expect(jaccardSimilarity('usdc launch', 'tether ban')).toBe(0)
  })
})

describe('isDuplicate', () => {
  it('detects same URL', () => {
    expect(isDuplicate('https://a.com/1', 'https://a.com/1')).toBe(true)
  })

  it('detects URL with tracking param difference', () => {
    expect(isDuplicate(
      'https://coindesk.com/a?ref=t',
      'https://coindesk.com/a'
    )).toBe(true)
  })

  it('detects similar titles', () => {
    expect(isDuplicate(
      'https://a.com/1',
      'https://b.com/2',
      'USDC price remains stable today',
      'USDC price remains stable today'
    )).toBe(true)
  })

  it('returns false for different content', () => {
    expect(isDuplicate(
      'https://a.com/1',
      'https://b.com/2',
      'USDC launch',
      'Tether banned'
    )).toBe(false)
  })
})

describe('classifyTags', () => {
  it('classifies USDT + regulation', () => {
    expect(classifyTags('Tether freezes USDT on Tron')).toEqual(
      expect.arrayContaining(['usdt'])
    )
  })

  it('classifies USDC', () => {
    expect(classifyTags('Circle announces USDC on Base')).toEqual(
      expect.arrayContaining(['usdc'])
    )
  })

  it('classifies AI payments', () => {
    expect(classifyTags('x402 protocol sees 1M transactions')).toEqual(
      expect.arrayContaining(['ai-payments'])
    )
  })

  it('defaults to other', () => {
    expect(classifyTags('Fed rate decision impact on stables')).toEqual(['other'])
  })

  it('supports multiple tags', () => {
    const tags = classifyTags('USDT USDC both hit record highs')
    expect(tags).toContain('usdt')
    expect(tags).toContain('usdc')
  })
})

describe('classifySeverity', () => {
  it('classifies depeg as high', () => {
    expect(classifySeverity('USDT depeg to $0.97')).toBe('high')
  })

  it('classifies IPO as positive', () => {
    expect(classifySeverity('Circle IPO milestone reached')).toBe('positive')
  })

  it('classifies audit as medium', () => {
    expect(classifySeverity('Tether quarterly audit released')).toBe('medium')
  })

  it('defaults to low', () => {
    expect(classifySeverity('DeFi liquidity pool grows')).toBe('low')
  })
})
