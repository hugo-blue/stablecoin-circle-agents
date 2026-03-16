'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts'
import { formatUSD, formatUSDFull } from '@/lib/format'
import type { MultiCoinFlow } from '@/types'

interface MintBurnChartProps {
  data: MultiCoinFlow[]
  isLoading?: boolean
}

type Period = '30D' | '90D' | '1Y'

const COIN_COLORS: Record<string, string> = {
  USDT: '#26a69a',
  USDC: '#2962ff',
  DAI: '#f5ac37',
  FDUSD: '#e91e63',
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="text-gray-500 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.dataKey}</span>
          <span className={`font-semibold ${p.value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {formatUSDFull(p.value)}
          </span>
        </p>
      ))}
    </div>
  )
}

export function MintBurnChart({ data, isLoading }: MintBurnChartProps) {
  const [period, setPeriod] = useState<Period>('30D')

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  const days = period === '30D' ? 30 : period === '90D' ? 90 : 365
  const filtered = data.slice(-days)

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">发行 vs 赎回净流量</h3>
        <div className="flex gap-1">
          {(['30D', '90D', '1Y'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={filtered} stackOffset="sign">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) => v.slice(5)}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => formatUSD(v)}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#999" />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {Object.entries(COIN_COLORS).map(([sym, color]) => (
            <Bar
              key={sym}
              dataKey={sym}
              stackId="stack"
              fill={color}
              name={sym}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
