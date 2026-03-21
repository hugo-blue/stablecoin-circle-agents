export type ProviderInfo = {
  name: string
  category: string
  chain: string
  known: boolean
}

export type ProviderRegistry = Record<string, Omit<ProviderInfo, 'known'>>

type X402Accepts = {
  scheme?: string
  network?: string
  payTo?: string
  maxAmountRequired?: string
  asset?: string
}

type X402Header = {
  version?: string
  accepts?: X402Accepts[]
}

export function extractPayToAddress(header: string | null | undefined): string | null {
  if (!header) return null
  let parsed: X402Header
  try {
    parsed = JSON.parse(header)
  } catch {
    return null
  }
  const accepts = parsed.accepts
  if (!Array.isArray(accepts) || accepts.length === 0) return null
  const payTo = accepts[0]?.payTo
  return payTo || null
}

export function parseUsdcAmount(value: string): number {
  if (!value) throw new Error('Invalid USDC amount')

  let raw: number
  if (value.startsWith('0x') || value.startsWith('0X')) {
    raw = parseInt(value, 16)
  } else {
    // reject negatives and non-numeric strings
    if (!/^\d+$/.test(value)) throw new Error('Invalid USDC amount')
    raw = parseInt(value, 10)
  }

  if (isNaN(raw) || raw < 0) throw new Error('Invalid USDC amount')
  return raw / 1_000_000
}

export function classifyX402Provider(address: string, registry: ProviderRegistry): ProviderInfo {
  if (!address || !/^(0x.+|[1-9A-HJ-NP-Za-km-z]{32,44})$/.test(address)) {
    throw new Error('InvalidAddressError')
  }

  const lower = address.toLowerCase()
  for (const [key, info] of Object.entries(registry)) {
    if (key.toLowerCase() === lower) {
      return { ...info, known: true }
    }
  }

  return { name: 'Unknown', category: 'unknown', chain: 'unknown', known: false }
}
