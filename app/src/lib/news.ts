/**
 * Normalize URL for deduplication
 */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url)
    u.searchParams.delete('ref')
    u.searchParams.delete('utm_source')
    u.searchParams.delete('utm_medium')
    u.searchParams.delete('utm_campaign')
    u.hash = ''
    // Remove trailing slash
    let path = u.pathname.replace(/\/+$/, '') || '/'
    return `${u.protocol}//${u.host}${path}${u.search}`
  } catch {
    return url.toLowerCase().trim()
  }
}

/**
 * Tokenize text into words for Jaccard calculation
 */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff\s]/g, '')
      .split(/\s+/)
      .filter(Boolean)
  )
}

/**
 * Jaccard similarity between two strings
 */
export function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenize(a)
  const setB = tokenize(b)
  if (setA.size === 0 && setB.size === 0) return 1.0

  let intersection = 0
  for (const word of setA) {
    if (setB.has(word)) intersection++
  }
  const union = setA.size + setB.size - intersection
  if (union === 0) return 1.0
  return intersection / union
}

/**
 * Check if two news items are duplicates
 */
export function isDuplicate(
  urlA: string,
  urlB: string,
  titleA?: string,
  titleB?: string
): boolean {
  if (normalizeUrl(urlA) === normalizeUrl(urlB)) return true
  if (titleA && titleB && jaccardSimilarity(titleA, titleB) > 0.8) return true
  return false
}

const TAG_KEYWORDS: Record<string, string[]> = {
  usdt: ['tether', 'usdt', '泰达'],
  usdc: ['circle', 'usdc', 'eurc'],
  'ai-payments': ['x402', 'agent', 'agentkit', 'openclaw', 'superfluid', 'sablier', 'ai payment'],
  regulation: ['sec', 'cftc', 'mica', 'genius act', 'ban', 'lawsuit', 'enforcement', '监管', '合规'],
}

/**
 * Classify news tags based on keyword matching
 */
export function classifyTags(title: string): string[] {
  const lower = title.toLowerCase()
  const tags: string[] = []

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      tags.push(tag)
    }
  }

  return tags.length > 0 ? tags : ['other']
}

const SEVERITY_KEYWORDS: Record<string, string[]> = {
  high: ['depeg', 'hack', 'ban', 'freeze', 'lawsuit', 'crash', '脱锚', '冻结', '被黑'],
  positive: ['launch', 'partnership', 'approved', 'ipo', 'milestone', '上线', '合作', '获批'],
  medium: ['regulation', 'audit', 'report', 'update', '监管', '审计', '报告'],
}

/**
 * Classify news severity based on keyword matching
 */
export function classifySeverity(title: string): 'high' | 'positive' | 'medium' | 'low' {
  const lower = title.toLowerCase()

  // Check in priority order
  for (const severity of ['high', 'positive', 'medium'] as const) {
    if (SEVERITY_KEYWORDS[severity].some(kw => lower.includes(kw))) {
      return severity
    }
  }

  return 'low'
}
