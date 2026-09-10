import { NextResponse } from 'next/server'
import { fetchFacilitatorOnchain, type X402OnchainData } from '@/lib/x402-basescan'

// 每次请求实时执行（否则 App Router 构建时静态缓存该路由 → 数据冻结）。
export const dynamic = 'force-dynamic'

// 数据类型对外沿用本路由路径（页面 import type 自此）。
export type { X402OnchainData, DailyTxCount } from '@/lib/x402-basescan'

// ─── 模块级 1 小时缓存（限制对 Blockscout 的调用频率）──────────────────────────
type CacheEntry = { ts: number; data: X402OnchainData }
let cache: CacheEntry | null = null
const CACHE_TTL_MS = 60 * 60 * 1000

/** Reset cache — 仅供测试使用 */
export function _resetCache() { cache = null }

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    return NextResponse.json({ state: 'success', data: cache.data, updatedAt: new Date(cache.ts).toISOString() })
  }

  try {
    const data = await fetchFacilitatorOnchain()
    // 所有地址都抓取失败 → 源不可达（不缓存失败结果）
    if (data.failedAddresses >= data.totalAddresses) {
      return NextResponse.json({ state: 'error', data: null, updatedAt: new Date().toISOString() })
    }
    cache = { ts: Date.now(), data }
    return NextResponse.json({ state: 'success', data, updatedAt: new Date().toISOString() })
  } catch {
    return NextResponse.json({ state: 'error', data: null, updatedAt: new Date().toISOString() })
  }
}
