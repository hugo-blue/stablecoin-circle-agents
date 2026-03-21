import { NextResponse } from 'next/server'
import { probeX402Endpoint } from '@/lib/x402-probe'

export type ProviderTrackStatus = 'verified' | 'endpoint_known' | 'pending' | 'not_x402'

export type Provider = {
  name: string
  category: string
  chain: string
  payToAddress: string | null
  endpoint: string | null
  priceUsdc: number | null
  trackStatus: ProviderTrackStatus
  lastCheckedAt: string | null
}

// Static registry — payToAddress populated once probed via 402 response header
const PROVIDERS: Provider[] = [
  // 网页数据
  {
    name: 'Firecrawl',
    category: '网页数据',
    chain: 'Base',
    payToAddress: null,
    endpoint: 'https://api.firecrawl.dev/v1/x402/search',
    priceUsdc: null,
    trackStatus: 'endpoint_known',
    lastCheckedAt: null,
  },
  {
    name: 'Zyte API',
    category: '网页数据',
    chain: 'Base',
    payToAddress: null,
    endpoint: null,
    priceUsdc: null,
    trackStatus: 'pending',
    lastCheckedAt: null,
  },
  // 链上数据
  {
    name: 'Messari',
    category: '链上数据',
    chain: 'Base',
    payToAddress: null,
    endpoint: 'https://data.messari.io/api/v1/assets',  // x402 gate path TBD
    priceUsdc: null,
    trackStatus: 'endpoint_known',
    lastCheckedAt: null,
  },
  // 社交 & 链上数据
  {
    name: 'Neynar',
    category: '社交数据',
    chain: 'Base',
    payToAddress: null,
    endpoint: null,
    priceUsdc: null,
    trackStatus: 'pending',
    lastCheckedAt: null,
  },
  {
    name: 'Einstein AI',
    category: '链上数据',
    chain: 'Base',
    payToAddress: null,
    endpoint: null,
    priceUsdc: null,
    trackStatus: 'pending',
    lastCheckedAt: null,
  },
  {
    name: 'WalletIQ',
    category: '链上数据',
    chain: 'Base',
    payToAddress: null,
    endpoint: null,
    priceUsdc: 0.005,
    trackStatus: 'pending',
    lastCheckedAt: null,
  },
  // AI 推理
  {
    name: 'BlockRun.AI',
    category: 'AI推理',
    chain: 'Base',
    payToAddress: null,
    endpoint: null,
    priceUsdc: null,
    trackStatus: 'pending',
    lastCheckedAt: null,
  },
  {
    name: 'AskClaude',
    category: 'AI推理',
    chain: 'Base',
    payToAddress: null,
    endpoint: null,
    priceUsdc: 0.01,
    trackStatus: 'pending',
    lastCheckedAt: null,
  },
  {
    name: 'Obol',
    category: 'AI推理',
    chain: 'Base',
    payToAddress: null,
    endpoint: null,
    priceUsdc: 5.0,
    trackStatus: 'pending',
    lastCheckedAt: null,
  },
  // 存储 & 基础设施
  {
    name: 'Pinata',
    category: '存储',
    chain: 'Base',
    payToAddress: null,
    endpoint: null,
    priceUsdc: null,
    trackStatus: 'pending',
    lastCheckedAt: null,
  },
  {
    name: 'Bitrefill',
    category: '电商',
    chain: 'EVM+Solana',
    payToAddress: null,
    endpoint: null,
    priceUsdc: null,
    trackStatus: 'pending',
    lastCheckedAt: null,
  },
]

// In-process cache: probe results survive for 1 hour
let cache: { data: Provider[]; updatedAt: number } | null = null
const CACHE_TTL_MS = 60 * 60 * 1_000

export function clearCache() { cache = null }

async function getProviders(): Promise<Provider[]> {
  if (cache && Date.now() - cache.updatedAt < CACHE_TTL_MS) {
    return cache.data
  }

  // Probe all endpoint_known providers in parallel
  const probed = await Promise.all(
    PROVIDERS.map(async p => {
      if (p.trackStatus !== 'endpoint_known' || !p.endpoint) return p
      const payTo = await probeX402Endpoint(p.endpoint)
      if (!payTo) return p
      return {
        ...p,
        payToAddress: payTo,
        trackStatus: 'verified' as const,
        lastCheckedAt: new Date().toISOString(),
      }
    })
  )

  cache = { data: probed, updatedAt: Date.now() }
  return probed
}

export async function GET() {
  const data = await getProviders()
  return NextResponse.json({ data, state: 'success' })
}
