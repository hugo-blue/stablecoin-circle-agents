import { isDuplicate, classifyTags, classifySeverity, normalizeUrl } from '@/lib/news'

export type NewsItem = {
  id: string
  title: string
  titleZh?: string      // Chinese translation (best-effort)
  url: string
  source: string
  publishedAt: string   // ISO string
  tags: string[]
  severity: 'high' | 'positive' | 'medium' | 'low'
}

type RSSSource = { name: string; url: string }

const SOURCES: RSSSource[] = [
  { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss' },
  { name: 'CoinDesk',      url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
  { name: 'Decrypt',       url: 'https://decrypt.co/feed' },
  { name: 'The Block',     url: 'https://www.theblock.co/rss.xml' },
]

// ─── XML helpers ─────────────────────────────────────────────────────────────

function extractTag(xml: string, tag: string): string {
  const pattern = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`,
    'i'
  )
  const m = xml.match(pattern)
  if (!m) return ''
  return m[1]
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const pattern = new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, 'i')
  const m = xml.match(pattern)
  return m ? m[1].trim() : ''
}

// djb2 hash → base36 id
function makeId(url: string): string {
  let h = 5381
  for (let i = 0; i < url.length; i++) {
    h = (((h << 5) + h) ^ url.charCodeAt(i)) >>> 0
  }
  return h.toString(36)
}

function parseItems(xml: string, sourceName: string): NewsItem[] {
  const items: NewsItem[] = []

  // RSS 2.0 <item>
  const rssRe = /<item>([\s\S]*?)<\/item>/g
  let m
  while ((m = rssRe.exec(xml)) !== null) {
    const x = m[1]
    const title = extractTag(x, 'title')
    const url   = extractTag(x, 'link') || extractAttr(x, 'link', 'href')
    const pub   = extractTag(x, 'pubDate') || extractTag(x, 'dc:date')
    if (!title || !url) continue
    const normalized = normalizeUrl(url)
    items.push({
      id: makeId(normalized),
      title,
      url: normalized,
      source: sourceName,
      publishedAt: pub ? new Date(pub).toISOString() : new Date().toISOString(),
      tags: classifyTags(title),
      severity: classifySeverity(title),
    })
  }

  // Atom <entry>
  const atomRe = /<entry>([\s\S]*?)<\/entry>/g
  while ((m = atomRe.exec(xml)) !== null) {
    const x = m[1]
    const title = extractTag(x, 'title')
    const url   = extractAttr(x, 'link', 'href') || extractTag(x, 'link')
    const pub   = extractTag(x, 'published') || extractTag(x, 'updated')
    if (!title || !url) continue
    const normalized = normalizeUrl(url)
    items.push({
      id: makeId(normalized),
      title,
      url: normalized,
      source: sourceName,
      publishedAt: pub ? new Date(pub).toISOString() : new Date().toISOString(),
      tags: classifyTags(title),
      severity: classifySeverity(title),
    })
  }

  return items
}

async function fetchSource(src: RSSSource): Promise<NewsItem[]> {
  try {
    const res = await fetch(src.url, {
      headers: { 'User-Agent': 'StablePulse/1.0 RSS Reader (+https://stablepulse.app)' },
      signal: AbortSignal.timeout(8_000),
    })
    if (!res.ok) return []
    const xml = await res.text()
    return parseItems(xml, src.name)
  } catch {
    return []
  }
}

// ─── Translation (Google Translate gtx, no API key) ─────────────────────────

const TRANSLATE_BATCH = 20

async function translateBatch(titles: string[]): Promise<string[]> {
  const joined = titles.join('\n')
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(joined)}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) return titles
    const data = (await res.json()) as [[string, string | null][], unknown, string]
    const translated = data[0].map(seg => seg[0]).join('')
    const parts = translated.split('\n')
    if (parts.length !== titles.length) return titles
    return parts.map(s => s.trim())
  } catch {
    return titles
  }
}

async function translateItems(items: NewsItem[]): Promise<NewsItem[]> {
  const result: NewsItem[] = []
  for (let i = 0; i < items.length; i += TRANSLATE_BATCH) {
    const batch = items.slice(i, i + TRANSLATE_BATCH)
    const titles = batch.map(item => item.title)
    const translated = await translateBatch(titles)
    for (let j = 0; j < batch.length; j++) {
      const zh = translated[j]?.trim()
      result.push({ ...batch[j], titleZh: zh && zh !== batch[j].title ? zh : undefined })
    }
  }
  return result
}

// ─── Module-level cache (30 min) ─────────────────────────────────────────────

let cache: { items: NewsItem[]; fetchedAt: number } | null = null
const CACHE_TTL_MS = 30 * 60 * 1_000

export async function fetchAllNews(): Promise<NewsItem[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.items
  }

  const results = await Promise.all(SOURCES.map(fetchSource))
  const raw = results.flat()

  // Deduplicate
  const seen: NewsItem[] = []
  for (const item of raw) {
    if (!seen.some(s => isDuplicate(s.url, item.url, s.title, item.title))) {
      seen.push(item)
    }
  }

  // Sort newest first
  seen.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  const translated = await translateItems(seen.slice(0, 120))
  cache = { items: translated, fetchedAt: Date.now() }
  return cache.items
}

export function clearNewsCache() { cache = null }
