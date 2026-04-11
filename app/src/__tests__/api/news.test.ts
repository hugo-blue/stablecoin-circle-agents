import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/news/route'
import { clearNewsCache } from '@/lib/api/news-rss'

function isIsoTimestamp(v: unknown): boolean {
  return typeof v === 'string' && !isNaN(Date.parse(v))
}

describe('GET /api/news', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    clearNewsCache()
  })

  afterEach(() => {
    clearNewsCache()
  })

  it('returns correct shape when RSS sources fail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const req = new NextRequest('http://localhost:3000/api/news')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(['success', 'empty', 'error']).toContain(body.state)
    expect(Array.isArray(body.data)).toBe(true)
    expect(isIsoTimestamp(body.updatedAt)).toBe(true)
    expect(typeof body.total).toBe('number')
    expect(typeof body.category).toBe('string')
  })

  it('degrades gracefully — returns empty array not a 500', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const req = new NextRequest('http://localhost:3000/api/news')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.length).toBe(0)
  })

  it('respects ?category param', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const req = new NextRequest('http://localhost:3000/api/news?category=usdc')
    const res = await GET(req)
    const body = await res.json()

    expect(body.category).toBe('usdc')
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('respects ?limit param', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const req = new NextRequest('http://localhost:3000/api/news?limit=3')
    const res = await GET(req)
    const body = await res.json()

    expect(body.data.length).toBeLessThanOrEqual(3)
  })

  it('each item has required fields when data is returned', async () => {
    // Mock a minimal valid RSS feed
    const mockRSS = `<?xml version="1.0"?><rss version="2.0"><channel>
      <item>
        <title>Circle announces USDC expansion on Base</title>
        <link>https://example.com/circle-usdc-base</link>
        <pubDate>Sat, 11 Apr 2026 10:00:00 +0000</pubDate>
      </item>
    </channel></rss>`

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockRSS),
    }))

    const req = new NextRequest('http://localhost:3000/api/news')
    const res = await GET(req)
    const body = await res.json()

    if (body.data.length > 0) {
      const item = body.data[0]
      expect(typeof item.id).toBe('string')
      expect(typeof item.title).toBe('string')
      expect(typeof item.url).toBe('string')
      expect(typeof item.source).toBe('string')
      expect(typeof item.publishedAt).toBe('string')
      expect(Array.isArray(item.tags)).toBe(true)
      expect(['high', 'positive', 'medium', 'low']).toContain(item.severity)
    }
  })
})
