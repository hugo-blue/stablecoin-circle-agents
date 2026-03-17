'use client'

import { useState, useEffect } from 'react'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'

interface DataPoint {
  date: string
  totalMarketCapB: number
  usdcMarketCapB: number
  usdcSharePct: number
  tbillRate: number | null
}

function DeltaBadge({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value === 0) return null
  const up = value > 0
  return (
    <span className={`text-xs font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? '↑' : '↓'}{Math.abs(value).toFixed(1)}{suffix}
    </span>
  )
}

function MetricCard({
  label,
  value,
  delta,
  suffix = '',
  color,
}: {
  label: string
  value: string
  delta?: number
  suffix?: string
  color: string
}) {
  return (
    <div className="rounded-lg bg-gray-50 px-4 py-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-xl font-semibold" style={{ color }}>{value}</p>
        {delta !== undefined && <DeltaBadge value={delta} suffix={suffix} />}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-bold text-gray-900 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-gray-700">{p.name}:</span>
          <span className="font-semibold text-gray-900">
            {p.dataKey === 'tbillRate'
              ? `${p.value?.toFixed(2)}%`
              : p.dataKey === 'usdcSharePct'
              ? `${p.value?.toFixed(1)}%`
              : `$${p.value?.toFixed(1)}B`}
          </span>
        </div>
      ))}
    </div>
  )
}

export function CircleKeyMetricsTrend() {
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/market/stablecoin-history')
      .then(r => r.json())
      .then(json => {
        if (json.data?.length) setData(json.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const latest = data[data.length - 1]
  const prev = data[data.length - 2]

  const deltaTotal = latest && prev ? latest.totalMarketCapB - prev.totalMarketCapB : 0
  const deltaShare = latest && prev ? latest.usdcSharePct - prev.usdcSharePct : 0
  const deltaRate = latest && prev && latest.tbillRate != null && prev.tbillRate != null
    ? latest.tbillRate - prev.tbillRate : 0

  // Only show every other month label to avoid crowding
  const tickFormatter = (val: string, idx: number) => idx % 3 === 0 ? val : ''

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">核心指标趋势</h3>
        <p className="text-xs text-gray-500 mt-0.5">稳定币市值 · USDC 占比 · 美联储利率｜过去 24 个月</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-sm text-gray-400">加载中…</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <MetricCard
              label="稳定币总市值"
              value={latest ? `$${latest.totalMarketCapB.toFixed(0)}B` : '—'}
              delta={deltaTotal}
              suffix="B"
              color="#2962ff"
            />
            <MetricCard
              label="USDC 市场占比"
              value={latest ? `${latest.usdcSharePct.toFixed(1)}%` : '—'}
              delta={deltaShare}
              suffix="%"
              color="#26a69a"
            />
            <MetricCard
              label="3M T-Bill 利率"
              value={latest?.tbillRate != null ? `${latest.tbillRate.toFixed(2)}%` : '—'}
              delta={deltaRate}
              suffix="%"
              color="#f5ac37"
            />
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data} margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#111827' }}
                tickFormatter={tickFormatter}
              />
              {/* Left axis: market cap $B */}
              <YAxis
                yAxisId="cap"
                orientation="left"
                tick={{ fontSize: 10, fill: '#111827' }}
                tickFormatter={(v: number) => `$${v}B`}
                width={55}
              />
              {/* Right axis: % */}
              <YAxis
                yAxisId="pct"
                orientation="right"
                tick={{ fontSize: 10, fill: '#111827' }}
                tickFormatter={(v: number) => `${v}%`}
                width={40}
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#111827', paddingTop: 8 }}
              />
              <Line
                yAxisId="cap"
                type="monotone"
                dataKey="totalMarketCapB"
                name="稳定币总市值"
                stroke="#2962ff"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                yAxisId="cap"
                type="monotone"
                dataKey="usdcMarketCapB"
                name="USDC 市值"
                stroke="#1565c0"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                yAxisId="pct"
                type="monotone"
                dataKey="usdcSharePct"
                name="USDC 占比"
                stroke="#26a69a"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                yAxisId="pct"
                type="monotone"
                dataKey="tbillRate"
                name="T-Bill 利率"
                stroke="#f5ac37"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>

          <p className="text-xs text-gray-400 mt-2">
            数据来源：DefiLlama · FRED DTB3 | 月度数据，每小时更新
          </p>
        </>
      )}
    </div>
  )
}
