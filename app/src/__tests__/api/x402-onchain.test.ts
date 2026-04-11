import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, _resetCache } from '@/app/api/ai-payments/x402-onchain/route'
import { BASE_USDC_CONTRACT } from '@/lib/data/cdp-facilitators'

// ─── helpers ──────────────────────────────────────────────────────────────────

const RECENT_TS = String(Math.floor((Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000)) // 2 days ago
const OLD_TS = String(Math.floor((Date.now() - 40 * 24 * 60 * 60 * 1000) / 1000))  // 40 days ago (outside window)

function makeTx(to: string, isError = '0', ts = RECENT_TS) {
  return { timeStamp: ts, to, isError }
}

function makeBasescanResp(txs: object[]) {
  return { ok: true, json: () => Promise.resolve({ status: '1', message: 'OK', result: txs }) }
}

const EMPTY_RESP = { ok: true, json: () => Promise.resolve({ status: '0', message: 'No transactions found', result: [] }) }
const ERROR_RESP = { ok: false, json: () => Promise.resolve({}) }

// ─── tests ────────────────────────────────────────────────────────────────────

describe('GET /api/ai-payments/x402-onchain', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubEnv('ETHERSCAN_API_KEY', 'test-key-123')
    _resetCache()
  })

  it('returns correct top-level shape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(EMPTY_RESP))
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(['success', 'partial', 'error']).toContain(body.state)
    expect(typeof body.updatedAt).toBe('string')
    expect(body).toHaveProperty('data')
  })

  it('data has dailyTxCounts (30 entries), totalAddresses, activeAddresses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(EMPTY_RESP))
    const res = await GET()
    const { data } = await res.json()

    expect(Array.isArray(data.dailyTxCounts)).toBe(true)
    expect(data.dailyTxCounts.length).toBe(30)
    expect(typeof data.dailyTxCounts[0].date).toBe('string')
    expect(typeof data.dailyTxCounts[0].txCount).toBe('number')
    expect(data.totalAddresses).toBe(25)
    expect(typeof data.activeAddresses).toBe('number')
  })

  it('counts only USDC transactions (to == BASE_USDC_CONTRACT)', async () => {
    // First address returns 3 txs (2 USDC, 1 non-USDC); rest return empty
    let callCount = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      if (callCount++ === 0) {
        return Promise.resolve(makeBasescanResp([
          makeTx(BASE_USDC_CONTRACT),              // USDC → count
          makeTx('0xother_contract'),               // not USDC → skip
          makeTx(BASE_USDC_CONTRACT.toUpperCase()), // case insensitive → count
        ]))
      }
      return Promise.resolve(EMPTY_RESP)
    }))
    const res = await GET()
    const { data } = await res.json()

    const total = data.dailyTxCounts.reduce((s: number, d: { txCount: number }) => s + d.txCount, 0)
    expect(total).toBe(2) // only the 2 USDC txs
  })

  it('excludes failed transactions (isError != "0")', async () => {
    // First address returns 2 txs (1 success, 1 failed); rest return empty
    let callCount = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      if (callCount++ === 0) {
        return Promise.resolve(makeBasescanResp([
          makeTx(BASE_USDC_CONTRACT, '0'),  // success → count
          makeTx(BASE_USDC_CONTRACT, '1'),  // failed → skip
        ]))
      }
      return Promise.resolve(EMPTY_RESP)
    }))
    const res = await GET()
    const { data } = await res.json()

    const total = data.dailyTxCounts.reduce((s: number, d: { txCount: number }) => s + d.txCount, 0)
    expect(total).toBe(1)
  })

  it('excludes transactions older than 30 days', async () => {
    // First address returns 2 txs (1 recent, 1 old); rest return empty
    let callCount = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      if (callCount++ === 0) {
        return Promise.resolve(makeBasescanResp([
          makeTx(BASE_USDC_CONTRACT, '0', RECENT_TS), // recent → count
          makeTx(BASE_USDC_CONTRACT, '0', OLD_TS),    // old → skip
        ]))
      }
      return Promise.resolve(EMPTY_RESP)
    }))
    const res = await GET()
    const { data } = await res.json()

    const total = data.dailyTxCounts.reduce((s: number, d: { txCount: number }) => s + d.txCount, 0)
    expect(total).toBe(1)
  })

  it('returns state=error when ETHERSCAN_API_KEY is missing', async () => {
    vi.stubEnv('ETHERSCAN_API_KEY', '')
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.state).toBe('error')
    expect(body.data).toBeNull()
  })

  it('returns state=success even if some addresses return HTTP errors (fetch continues)', async () => {
    let callCount = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      callCount++
      // first call fails, rest return empty
      return callCount === 1 ? Promise.resolve(ERROR_RESP) : Promise.resolve(EMPTY_RESP)
    }))
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.state).toBe('success')
    expect(body.data.dailyTxCounts.length).toBe(30)
  })

  it('activeAddresses counts only addresses that had USDC txs', async () => {
    let callCount = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      callCount++
      // first address has 1 USDC tx, rest are empty
      if (callCount === 1) {
        return Promise.resolve(makeBasescanResp([makeTx(BASE_USDC_CONTRACT)]))
      }
      return Promise.resolve(EMPTY_RESP)
    }))
    const res = await GET()
    const { data } = await res.json()

    expect(data.activeAddresses).toBe(1)
  })
})
