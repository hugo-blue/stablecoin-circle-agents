'use client'

import { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface MarketShareChartProps {
  data: Array<{
    date: string
    USDT: number
    USDC: number
    DAI: number
    FDUSD: number
    Other: number
  }>
  isLoading?: boolean
}

const COLORS: Record<string, string> = {
  USDT: '#26a69a',
  USDC: '#2962ff',
  DAI: '#f5ac37',
  FDUSD: '#e91e63',
  Other: '#9e9e9e',
}

const TRACKED = ['USDT', 'USDC', 'DAI', 'FDUSD']

export function MarketShareChart({ data, isLoading }: MarketShareChartProps) {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '1Y' | 'ALL'>('30D')

  const days = timeRange === '7D' ? 7 : timeRange === '30D' ? 30 : timeRange === '1Y' ? 365 : data.length
  const filtered = data.slice(-days)

  // Calculate change over period for each coin
  const changes = useMemo(() => {
    if (filtered.length < 2) return null
    const first = filtered[0]
    const last = filtered[filtered.length - 1]
    const result: Record<string, number> = {}
    for (const sym of TRACKED) {
      const start = (first as any)[sym] || 0
      const end = (last as any)[sym] || 0
      result[sym] = Math.round((end - start) * 100) / 100 // percentage point change
    }
    return result
  }, [filtered])

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse" />
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">市占率趋势</h3>
        <div className="flex gap-1">
          {(['7D', '30D', '1Y', 'ALL'] as const).map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                timeRange === r
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Period change indicators */}
      {changes && (
        <div className="flex gap-3 mb-3 flex-wrap">
          {TRACKED.map(sym => {
            const ch = changes[sym]
            if (ch === undefined) return null
            const color = ch > 0 ? 'text-green-600' : ch < 0 ? 'text-red-500' : 'text-gray-500'
            return (
              <span key={sym} className="text-xs">
                <span style={{ color: COLORS[sym] }} className="font-medium">{sym}</span>
                {' '}
                <span className={color}>{ch > 0 ? '+' : ''}{ch.toFixed(2)}pp</span>
              </span>
            )
          })}
        </div>
      )}

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={filtered}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} domain={[0, 100]} />
          <Tooltip
            formatter={(value: any, name: any) => [`${Number(value).toFixed(2)}%`, name]}
            labelFormatter={(label: any) => String(label)}
          />
          {Object.keys(COLORS).map(key => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stackId="1"
              fill={COLORS[key]}
              stroke={COLORS[key]}
              fillOpacity={0.8}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
