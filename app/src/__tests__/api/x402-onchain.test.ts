import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, _resetCache } from '@/app/api/ai-payments/x402-onchain/route'
import { CDP_FACILITATOR_ADDRESSES } from '@/lib/data/cdp-facilitators'

// ─── helpers ──────────────────────────────────────────────────────────────────
// 数据源为 Base Blockscout 的 USDC tokentx；口径 = 统计 facilitator 转出（from = facilitator）。

const FAC0 = CDP_FACILITATOR_ADDRESSES[0]
const RECENT_TS = String(Math.floor((Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000)) // 2 天前
const OLD_TS = String(Math.floor((Date.now() - 40 * 24 * 60 * 60 * 1000) / 1000))   // 40 天前（窗口外）

// 一笔 USDC 转账；from 决定是否算作该 facilitator 的转出
function transfer(from: string, ts = RECENT_TS) {
  return { timeStamp: ts, from, to: '0x0000000000000000000000000000000000000001' }
}

function okResp(txs: object[]) {
  return { ok: true, json: () => Promise.resolve({ status: '1', message: 'OK', result: txs }) }
}
const EMPTY_RESP = { ok: true, json: () => Promise.resolve({ status: '0', message: 'No transactions found', result: [] }) }
const HTTP_ERR = { ok: false, json: () => Promise.resolve({}) }
const API_ERR = { ok: true, json: () => Promise.resolve({ status: '0', message: 'Max rate limit reached', result: [] }) }

// 按请求 URL 里的 address 参数分发响应（对并发顺序稳健）
function urlMock(handler: (url: string) => unknown) {
  return vi.fn().mockImplementation((input: unknown) => Promise.resolve(handler(String(input).toLowerCase())))
}
const isFac0 = (url: string) => url.includes(FAC0.toLowerCase())

describe('GET /api/ai-payments/x402-onchain', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    _resetCache()
  })

  it('returns correct top-level shape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(EMPTY_RESP))
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(['success', 'error']).toContain(body.state)
    expect(typeof body.updatedAt).toBe('string')
    expect(body).toHaveProperty('data')
  })

  it('data has dailyTxCounts (30 entries), totalAddresses, activeAddresses, failedAddresses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(EMPTY_RESP))
    const res = await GET()
    const { data } = await res.json()

    expect(Array.isArray(data.dailyTxCounts)).toBe(true)
    expect(data.dailyTxCounts.length).toBe(30)
    expect(typeof data.dailyTxCounts[0].date).toBe('string')
    expect(typeof data.dailyTxCounts[0].txCount).toBe('number')
    expect(data.totalAddresses).toBe(25)
    expect(typeof data.activeAddresses).toBe('number')
    expect(typeof data.failedAddresses).toBe('number')
  })

  it('counts only outgoing USDC transfers (from == facilitator)', async () => {
    // FAC0 返回 3 笔：2 笔 from=FAC0（转出，计）+ 1 笔 from=其它（转入，跳过）
    vi.stubGlobal('fetch', urlMock(url => isFac0(url)
      ? okResp([transfer(FAC0), transfer('0xbuyeraaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'), transfer(FAC0.toUpperCase())])
      : EMPTY_RESP))
    const res = await GET()
    const { data } = await res.json()

    const total = data.dailyTxCounts.reduce((s: number, d: { txCount: number }) => s + d.txCount, 0)
    expect(total).toBe(2) // 仅 2 笔转出（大小写不敏感）
  })

  it('excludes transfers older than 30 days', async () => {
    vi.stubGlobal('fetch', urlMock(url => isFac0(url)
      ? okResp([transfer(FAC0, RECENT_TS), transfer(FAC0, OLD_TS)])
      : EMPTY_RESP))
    const res = await GET()
    const { data } = await res.json()

    const total = data.dailyTxCounts.reduce((s: number, d: { txCount: number }) => s + d.txCount, 0)
    expect(total).toBe(1)
  })

  it('activeAddresses counts only facilitators with ≥1 outgoing transfer', async () => {
    vi.stubGlobal('fetch', urlMock(url => isFac0(url)
      ? okResp([transfer(FAC0)])
      : EMPTY_RESP))
    const res = await GET()
    const { data } = await res.json()

    expect(data.activeAddresses).toBe(1)
  })

  it('returns state=success when some addresses fail but not all', async () => {
    // FAC0 HTTP 失败，其余「无交易」→ 部分失败 → 仍 success
    vi.stubGlobal('fetch', urlMock(url => isFac0(url) ? HTTP_ERR : EMPTY_RESP))
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.state).toBe('success')
    expect(body.data.dailyTxCounts.length).toBe(30)
    expect(body.data.failedAddresses).toBe(1)
  })

  it('returns state=error when ALL addresses fail (source unreachable)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(HTTP_ERR))
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.state).toBe('error')
    expect(body.data).toBeNull()
  }, 20000)

  it('treats API errors (e.g. rate limit) as failures, not zero', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(API_ERR))
    const res = await GET()
    const body = await res.json()

    expect(body.state).toBe('error') // 全部限流 = 源不可达，而非「真 0」
    expect(body.data).toBeNull()
  }, 20000)
})
