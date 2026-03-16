'use client'

import { formatUSD, formatPercent } from '@/lib/format'

interface MetricCardProps {
  label: string
  value: number | null
  change24h?: number | null
  prefix?: string
  isLoading?: boolean
  isStale?: boolean
}

export function MetricCard({ label, value, change24h, prefix, isLoading, isStale }: MetricCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
        <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-16" />
      </div>
    )
  }

  const changeColor =
    change24h != null
      ? change24h > 0
        ? 'text-green-600'
        : change24h < 0
          ? 'text-red-500'
          : 'text-gray-500'
      : ''

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      {isStale && (
        <div className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1 mb-2 inline-block">
          数据可能不是最新
        </div>
      )}
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">
        {prefix}{value != null ? formatUSD(value) : '$—'}
      </p>
      {change24h != null && (
        <p className={`text-sm mt-1 ${changeColor}`}>
          {formatPercent(change24h)} <span className="text-gray-400">24h</span>
        </p>
      )}
    </div>
  )
}
