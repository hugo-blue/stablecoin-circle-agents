import { describe, it, expect } from 'vitest'
import {
  extractPayToAddress,
  parseUsdcAmount,
  classifyX402Provider,
  type ProviderRegistry,
} from '@/lib/x402'

// ─── extractPayToAddress ─────────────────────────────────────────────────────

describe('extractPayToAddress', () => {
  it('returns payTo address from valid x402 header', () => {
    const header = JSON.stringify({
      version: 'x402-1',
      accepts: [{
        scheme: 'exact',
        network: 'eip155:8453',
        maxAmountRequired: '1000000',
        payTo: '0xabc1234567890123456789012345678901234def',
        asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      }],
    })
    expect(extractPayToAddress(header)).toBe('0xabc1234567890123456789012345678901234def')
  })

  it('returns Solana address from Solana network accepts', () => {
    const header = JSON.stringify({
      version: 'x402-1',
      accepts: [{
        scheme: 'exact',
        network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        maxAmountRequired: '1000000',
        payTo: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      }],
    })
    expect(extractPayToAddress(header)).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
  })

  it('returns first payTo when multiple accepts entries exist', () => {
    const header = JSON.stringify({
      version: 'x402-1',
      accepts: [
        { scheme: 'exact', network: 'eip155:8453', payTo: '0xfirst000000000000000000000000000000000001', maxAmountRequired: '1000000', asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
        { scheme: 'exact', network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', payTo: 'secondSolanaAddress', maxAmountRequired: '1000000', asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
      ],
    })
    expect(extractPayToAddress(header)).toBe('0xfirst000000000000000000000000000000000001')
  })

  it('returns null when header is missing x-payment-requirements field', () => {
    expect(extractPayToAddress(null)).toBeNull()
    expect(extractPayToAddress(undefined)).toBeNull()
    expect(extractPayToAddress('')).toBeNull()
  })

  it('returns null when header is invalid JSON', () => {
    expect(extractPayToAddress('not-json{')).toBeNull()
  })

  it('returns null when accepts array is empty', () => {
    const header = JSON.stringify({ version: 'x402-1', accepts: [] })
    expect(extractPayToAddress(header)).toBeNull()
  })

  it('returns null when payTo field is missing from accepts entry', () => {
    const header = JSON.stringify({
      version: 'x402-1',
      accepts: [{ scheme: 'exact', network: 'eip155:8453', maxAmountRequired: '1000000' }],
    })
    expect(extractPayToAddress(header)).toBeNull()
  })

  it('returns null when payTo is empty string', () => {
    const header = JSON.stringify({
      version: 'x402-1',
      accepts: [{ scheme: 'exact', network: 'eip155:8453', payTo: '', maxAmountRequired: '1000000' }],
    })
    expect(extractPayToAddress(header)).toBeNull()
  })
})

// ─── parseUsdcAmount ─────────────────────────────────────────────────────────

describe('parseUsdcAmount', () => {
  it('converts 6-decimal raw amount to USD', () => {
    expect(parseUsdcAmount('1000000')).toBe(1.0)
    expect(parseUsdcAmount('1000000000')).toBe(1000.0)
    expect(parseUsdcAmount('5000000')).toBe(5.0)
  })

  it('handles sub-cent amounts', () => {
    expect(parseUsdcAmount('100')).toBeCloseTo(0.0001, 6)
    expect(parseUsdcAmount('1')).toBeCloseTo(0.000001, 6)
  })

  it('handles zero', () => {
    expect(parseUsdcAmount('0')).toBe(0)
  })

  it('handles hex-encoded Transfer data', () => {
    // Basescan returns Transfer data as hex: 0x00...0f4240 = 1000000
    expect(parseUsdcAmount('0x00000000000000000000000000000000000000000000000000000000000f4240')).toBe(1.0)
  })

  it('throws on negative value', () => {
    expect(() => parseUsdcAmount('-1')).toThrow('Invalid USDC amount')
  })

  it('throws on non-numeric string', () => {
    expect(() => parseUsdcAmount('abc')).toThrow('Invalid USDC amount')
  })

  it('throws on empty string', () => {
    expect(() => parseUsdcAmount('')).toThrow('Invalid USDC amount')
  })
})

// ─── classifyX402Provider ─────────────────────────────────────────────────────

const MOCK_REGISTRY: ProviderRegistry = {
  '0xfirecrawl00000000000000000000000000000001': {
    name: 'Firecrawl',
    category: '网页数据',
    chain: 'Base',
  },
  '0xneynar000000000000000000000000000000000002': {
    name: 'Neynar',
    category: '社交数据',
    chain: 'Base',
  },
}

describe('classifyX402Provider', () => {
  it('returns provider info for known address', () => {
    const result = classifyX402Provider(
      '0xfirecrawl00000000000000000000000000000001',
      MOCK_REGISTRY
    )
    expect(result).toEqual({
      name: 'Firecrawl',
      category: '网页数据',
      chain: 'Base',
      known: true,
    })
  })

  it('returns Unknown for address not in registry', () => {
    const result = classifyX402Provider(
      '0xunknown000000000000000000000000000000099',
      MOCK_REGISTRY
    )
    expect(result).toEqual({
      name: 'Unknown',
      category: 'unknown',
      chain: 'unknown',
      known: false,
    })
  })

  it('is case-insensitive for EVM addresses', () => {
    const result = classifyX402Provider(
      '0xFIRECRAWL00000000000000000000000000000001',
      MOCK_REGISTRY
    )
    expect(result.name).toBe('Firecrawl')
  })

  it('throws on invalid address format', () => {
    expect(() => classifyX402Provider('', MOCK_REGISTRY)).toThrow('InvalidAddressError')
    expect(() => classifyX402Provider('not-an-address', MOCK_REGISTRY)).toThrow('InvalidAddressError')
  })

  it('handles empty registry', () => {
    const result = classifyX402Provider('0xabc0000000000000000000000000000000000001', {})
    expect(result.known).toBe(false)
    expect(result.name).toBe('Unknown')
  })
})
