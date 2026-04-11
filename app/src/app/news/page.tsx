'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import type { NewsItem } from '@/lib/api/news-rss'

type Category = 'all' | 'usdc' | 'ai-payments' | 'regulation'

const TABS: { key: Category; label: string }[] = [
  { key: 'all',         label: '全部' },
  { key: 'usdc',        label: 'USDC' },
  { key: 'ai-payments', label: 'AI 支付' },
  { key: 'regulation',  label: '监管' },
]

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

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtUpdated(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function NewsList() {
  const params = useSearchParams()
  const initCategory = (params.get('category') as Category) ?? 'all'

  const [category, setCategory] = useState<Category>(initCategory)
  const [items, setItems] = useState<NewsItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const qs = category !== 'all' ? `&category=${category}` : ''
    fetch(`/api/news?limit=50${qs}`)
      .then(r => r.json())
      .then(body => {
        setItems(body.data ?? [])
        setTotal(body.total ?? 0)
        if (body.updatedAt) setUpdatedAt(body.updatedAt)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [category])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">新闻中心</h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm text-gray-500">稳定币 · AI 支付 · 监管动态 — 实时聚合</p>
          {updatedAt && (
            <span className="text-xs text-gray-400">· 更新于 {fmtUpdated(updatedAt)}</span>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setCategory(tab.key)}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
              category === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
        {!loading && total > 0 && (
          <span className="ml-2 self-center text-xs text-gray-400">{total} 条</span>
        )}
      </div>

      {/* News list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {loading ? (
          <div className="p-4 space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-40" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            暂无相关新闻
          </div>
        ) : (
          items.map(item => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 leading-snug group-hover:text-blue-600 transition-colors">
                  {item.titleZh ?? item.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[11px] font-medium text-gray-500">{item.source}</span>
                  <span className="text-[10px] text-gray-300">·</span>
                  <span className="text-[10px] text-gray-400">{fmtDate(item.publishedAt)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SEVERITY_STYLE[item.severity]}`}>
                    {SEVERITY_LABEL[item.severity]}
                  </span>
                  {item.tags.filter(t => t !== 'other').map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </a>
          ))
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        来源：Cointelegraph · CoinDesk · Decrypt · The Block · 每 30 分钟更新
      </p>
    </div>
  )
}

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center text-gray-400 text-sm">加载中...</div>}>
      <NewsList />
    </Suspense>
  )
}
