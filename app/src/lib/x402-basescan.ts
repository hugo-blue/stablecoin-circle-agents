/**
 * x402 链上聚合（Base Blockscout）— 共享数据逻辑
 *
 * 数据源：Base 官方 Blockscout（https://base.blockscout.com/api，免费、无需 key、
 * 兼容 Etherscan V1 响应格式）。取代已弃用的 api.basescan.org V1
 * （Etherscan 已迁移到 V2，且 V2 的 Base 链免费 key 不支持）。
 *
 * 统计口径：对每个 CDP Facilitator 地址取 USDC tokentx，计其**转出**（from = facilitator）
 * 的转账笔数 = x402 结算笔数下界。activeAddresses = 近 30 天有 ≥1 笔转出的 facilitator 数。
 * failedAddresses = 抓取失败（HTTP/API 错误）的地址数——用于区分「真 0」与「源不可达」。
 *
 * 由 /api/ai-payments/x402-onchain 与 /api/ai-payments/x402-stats 共用。
 */
import { CDP_FACILITATOR_ADDRESSES, BASE_USDC_CONTRACT } from '@/lib/data/cdp-facilitators'

const BLOCKSCOUT_API = 'https://base.blockscout.com/api'

export type TokenTx = { timeStamp: string; from: string; to: string }
export type DailyTxCount = { date: string; txCount: number }
export type X402OnchainData = {
  dailyTxCounts: DailyTxCount[]  // 近 30 天，升序
  totalAddresses: number
  activeAddresses: number        // 近 30 天有 ≥1 笔 USDC 转出的 facilitator 地址数
  failedAddresses: number        // 抓取失败的地址数（区分真 0 与源不可达）
}

type FetchResult = { txs: TokenTx[]; ok: boolean }

/** 拉取单个地址的 USDC tokentx（单次）。ok=false 表示抓取失败（非「无交易」）。 */
async function fetchOnce(address: string): Promise<FetchResult> {
  const url = new URL(BLOCKSCOUT_API)
  url.searchParams.set('module', 'account')
  url.searchParams.set('action', 'tokentx')
  url.searchParams.set('contractaddress', BASE_USDC_CONTRACT)
  url.searchParams.set('address', address)
  url.searchParams.set('sort', 'desc')
  url.searchParams.set('page', '1')
  url.searchParams.set('offset', '200')

  let res: Response
  try {
    res = await fetch(url.toString(), { headers: { accept: 'application/json' } })
  } catch {
    return { txs: [], ok: false }
  }
  if (!res.ok) return { txs: [], ok: false }

  let body: { status?: string; message?: string; result?: unknown }
  try {
    body = await res.json()
  } catch {
    return { txs: [], ok: false }
  }

  if (body.status === '1' && Array.isArray(body.result)) {
    return { txs: body.result as TokenTx[], ok: true }
  }
  // Blockscout 空结果：status '0' + "No transactions found" → 真 0（非失败）
  if (body.status === '0' && /no transactions found/i.test(String(body.message ?? ''))) {
    return { txs: [], ok: true }
  }
  // 其它（限流 / 弃用 / 异常）→ 抓取失败
  return { txs: [], ok: false }
}

/** 带一次重试，缓解 Blockscout 偶发限流。 */
async function fetchUsdcTransfers(address: string): Promise<FetchResult> {
  const first = await fetchOnce(address)
  if (first.ok) return first
  await new Promise(r => setTimeout(r, process.env.NODE_ENV === 'test' ? 0 : 500))
  return fetchOnce(address)
}

// 用共享索引计数器实现的简单并发池
async function withConcurrency<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let next = 0
  async function worker() {
    while (next < tasks.length) {
      const i = next++
      results[i] = await tasks[i]()
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker))
  return results
}

function buildSeries(map: Map<string, number>): DailyTxCount[] {
  const result: DailyTxCount[] = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    result.push({ date, txCount: map.get(date) ?? 0 })
  }
  return result
}

/** 拉取 + 聚合 facilitator 地址池近 30 天的 USDC 转出（x402 结算）。 */
export async function fetchFacilitatorOnchain(): Promise<X402OnchainData> {
  const addresses = [...CDP_FACILITATOR_ADDRESSES]
  const results = await withConcurrency(addresses.map(a => () => fetchUsdcTransfers(a)), 2)

  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  const map = new Map<string, number>()
  let activeAddresses = 0
  let failedAddresses = 0

  results.forEach((r, i) => {
    if (!r.ok) { failedAddresses++; return }
    const fac = addresses[i].toLowerCase()
    let hasActivity = false
    for (const tx of r.txs) {
      if (!tx.from || tx.from.toLowerCase() !== fac) continue // 只算 facilitator 转出（结算）
      const ms = parseInt(tx.timeStamp, 10) * 1000
      if (isNaN(ms) || ms < cutoff) continue
      const date = new Date(ms).toISOString().slice(0, 10)
      map.set(date, (map.get(date) ?? 0) + 1)
      hasActivity = true
    }
    if (hasActivity) activeAddresses++
  })

  return {
    dailyTxCounts: buildSeries(map),
    totalAddresses: addresses.length,
    activeAddresses,
    failedAddresses,
  }
}
