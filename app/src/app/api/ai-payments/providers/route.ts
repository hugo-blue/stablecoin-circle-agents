import { NextResponse } from 'next/server'
import { probeX402Endpoint } from '@/lib/x402-probe'

// probe_blocked: endpoint confirmed, but auth middleware blocks probe before reaching 402
export type ProviderTrackStatus = 'verified' | 'endpoint_known' | 'probe_blocked' | 'pending' | 'not_x402'

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
// V2 note: most production servers use Dynamic payTo routing (Facilitator address, not direct wallet).
// Probe may return Facilitator address rather than server's own wallet.
const PROVIDERS: Provider[] = [
  // AI Agent 生态（x402scan Top 1 — 77% of daily volume, ACP-x402 convergence already live）
  {
    name: 'Virtuals Protocol',
    category: 'AI Agent生态',
    chain: 'Base',
    payToAddress: null,
    endpoint: 'https://acp-x402.virtuals.io',
    priceUsdc: null,
    trackStatus: 'endpoint_known',  // x402scan confirms live: 50K+ daily txns
    lastCheckedAt: null,
  },
  // DeFi 交易工具
  {
    name: 'SniperX',
    category: 'DeFi交易',
    chain: 'Base',
    payToAddress: null,
    endpoint: 'https://x402.sniperx.fun',
    priceUsdc: 0.02,
    trackStatus: 'endpoint_known',  // x402scan: 5.22K daily txns, 12 buyers (专业 Bot)
    lastCheckedAt: null,
  },
  // 网页数据
  {
    name: 'Firecrawl',
    category: '网页数据',
    chain: 'Base',
    payToAddress: null,
    // POST endpoint confirmed; auth middleware runs before x402 middleware —
    // probe returns 401 before reaching 402. payTo requires valid API key to reach x402 layer.
    endpoint: 'https://api.firecrawl.dev/v1/x402/search',
    priceUsdc: 0.01,
    trackStatus: 'probe_blocked',  // auth middleware fires before x402 middleware (401 before 402)
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
    name: 'Nansen',
    category: '链上数据',
    chain: 'Base',
    payToAddress: null,
    endpoint: 'https://api.nansen.ai',  // x402scan #10: 638 daily txns confirmed
    priceUsdc: null,
    trackStatus: 'endpoint_known',
    lastCheckedAt: null,
  },
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
  // 社交数据
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
  // AI 推理
  {
    name: 'BlockRun.AI',
    category: 'AI推理',
    chain: 'Base',
    payToAddress: null,
    endpoint: 'https://blockrun.ai',  // x402scan #5: 2.83K daily txns, $215.65 volume
    priceUsdc: null,
    trackStatus: 'endpoint_known',
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
