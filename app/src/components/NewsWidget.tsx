'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { NewsItem } from '@/lib/api/news-rss'

type Category = 'all' | 'usdc' | 'ai-payments' | 'regulation'

type Props = {
  category?: Category
  title?: string
}

function fmtAge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return '刚刚'
  if (h < 24) return `${h}h 前`
  const d = Math.floor(h / 24)
  return `${d}天前`
}

const SEVERITY_STYLE: Record<NewsItem['severity'], string> = {
  high:     'bg-red-100 text-red-700',
  positive: 'bg-green-100 text-green-700',
  medium:   'bg-amber-100 text-amber-700',
  low:      'bg-gray-100 text-gray-400',
}

const SEVERITY_LABEL: Record<NewsItem['severity'], string> = {
  high:     '⚠ 重要',
  positive: '利好',
  medium:   '动态',
  low:      '一般',
}

export function NewsWidget({ category = 'all', title = '最新动态' }: Props) {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  useEffect(() => {
    const qs = category !== 'all' ? `&category=${category}` : ''
    fetch(`/api/news?limit=3${qs}`)
      .then(r => r.json())
      .then(body => {
        setItems(body.data ?? [])
        if (body.updatedAt) setUpdatedAt(body.updatedAt)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [category])

  const morePath = `/news${category !== 'all' ? `?category=${category}` : ''}`

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {updatedAt && (
            <span className="text-[10px] text-gray-400">
              · {new Date(updatedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <Link href={morePath} className="text-xs text-blue-500 hover:underline flex-shrink-0">
          更多 →
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-1">
              <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-32" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-3">暂无相关新闻</p>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-800 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                  {item.titleZh ?? item.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-[10px] text-gray-400">{item.source}</span>
                  <span className="text-[10px] text-gray-300">·</span>
                  <span className="text-[10px] text-gray-400">{fmtAge(item.publishedAt)}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${SEVERITY_STYLE[item.severity]}`}>
                    {SEVERITY_LABEL[item.severity]}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
