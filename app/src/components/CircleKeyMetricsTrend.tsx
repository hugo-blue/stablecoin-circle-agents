'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from 'recharts'

interface DataPoint {
  date: string
  totalMarketCapB: number
  usdcMarketCapB: number
  usdcSharePct: number
  tbillRate: number | null
}

// Show only every Nth label to avoid crowding
function xTickFormatter(val: string, idx: number, total: number): string {
  const step = total <= 12 ? 2 : 4
  return idx % step === 0 ? val.slice(2) : '' // '2024-03' → '24-03'
}

function Sparkline({
  data,
  dataKey,
  color,
  yTickFormatter,
  isStep,
}: {
  data: DataPoint[]
  dataKey: keyof DataPoint
  color: string
  yTickFormatter: (v: number) => string
  isStep?: boolean
}) {
  const filtered = data.filter(d => d[dataKey] != null)
  const values = filtered.map(d => d[dataKey] as number)
  if (values.length === 0) return <div className="h-20 flex items-center justify-center text-xs text-gray-300">暂无数据</div>

  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = (max - min) * 0.2 || 0.5
  const domain: [number, number] = [min - pad, max + pad]

  return (
    <ResponsiveContainer width="100%" height={80}>
      <AreaChart data={filtered} margin={{ top: 4, bottom: 0, left: 0, right: 4 }}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 9, fill: '#9ca3af' }}
          tickFormatter={(val, idx) => xTickFormatter(val, idx, filtered.length)}
          axisLine={false}
          tickLine={false}
          height={16}
        />
        <YAxis
          domain={domain}
          tickCount={3}
          tick={{ fontSize: 9, fill: '#9ca3af' }}
          tickFormatter={yTickFormatter}
          width={36}
          axisLine={false}
          tickLine={false}
        />
        <Area
          type={isStep ? 'stepAfter' : 'monotone'}
          dataKey={dataKey as string}
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#grad-${dataKey})`}
          dot={false}
          connectNulls
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            const val = payload[0]?.value as number
            return (
              <div className="bg-white border border-gray-200 rounded px-2 py-1 text-xs shadow">
                <span className="text-gray-400 mr-1">{label}</span>
                <span className="font-semibold text-black">{yTickFormatter(val)}</span>
              </div>
            )
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function DeltaBadge({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value === 0) return null
  const up = value > 0
  const abs = Math.abs(value)
  const formatted = abs >= 10 ? abs.toFixed(0) : abs.toFixed(1)
  return (
    <span className={`text-xs font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? '↑' : '↓'}{formatted}{suffix}
    </span>
  )
}

interface CardConfig {
  title: string
  value: string
  delta: number
  suffix: string
  dataKey: keyof DataPoint
  color: string
  yTickFormatter: (v: number) => string
  isStep?: boolean
}

function MetricSparkCard({ cfg, data }: { cfg: CardConfig; data: DataPoint[] }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <p className="text-xs text-gray-500 mb-0.5">{cfg.title}</p>
      <div className="flex items-baseline gap-2 mb-1">
        <p className="text-xl font-semibold text-black">{cfg.value}</p>
        <DeltaBadge value={cfg.delta} suffix={cfg.suffix} />
      </div>
      <Sparkline
        data={data}
        dataKey={cfg.dataKey}
        color={cfg.color}
        yTickFormatter={cfg.yTickFormatter}
        isStep={cfg.isStep}
      />
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

  const cards: CardConfig[] = [
    {
      title: '稳定币总市值',
      value: latest ? `$${latest.totalMarketCapB.toFixed(0)}B` : '—',
      delta: latest && prev ? latest.totalMarketCapB - prev.totalMarketCapB : 0,
      suffix: 'B',
      dataKey: 'totalMarketCapB',
      color: '#2962ff',
      yTickFormatter: (v) => `$${v.toFixed(0)}B`,
    },
    {
      title: 'USDC 市值',
      value: latest ? `$${latest.usdcMarketCapB.toFixed(1)}B` : '—',
      delta: latest && prev ? latest.usdcMarketCapB - prev.usdcMarketCapB : 0,
      suffix: 'B',
      dataKey: 'usdcMarketCapB',
      color: '#1565c0',
      yTickFormatter: (v) => `$${v.toFixed(0)}B`,
    },
    {
      title: 'USDC 占比',
      value: latest ? `${latest.usdcSharePct.toFixed(1)}%` : '—',
      delta: latest && prev ? latest.usdcSharePct - prev.usdcSharePct : 0,
      suffix: '%',
      dataKey: 'usdcSharePct',
      color: '#26a69a',
      yTickFormatter: (v) => `${v.toFixed(1)}%`,
    },
    {
      title: 'T-Bill 利率',
      value: latest?.tbillRate != null ? `${latest.tbillRate.toFixed(2)}%` : '—',
      delta:
        latest && prev && latest.tbillRate != null && prev.tbillRate != null
          ? latest.tbillRate - prev.tbillRate
          : 0,
      suffix: '%',
      dataKey: 'tbillRate',
      color: '#f5ac37',
      yTickFormatter: (v) => `${v.toFixed(2)}%`,
      isStep: true, // Fed rate holds steady between meetings → step chart
    },
  ]

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">核心指标趋势</h3>
        <p className="text-xs text-gray-500 mt-0.5">过去 24 个月月度数据</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-sm text-gray-400">加载中…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            {cards.map(cfg => (
              <MetricSparkCard key={cfg.dataKey} cfg={cfg} data={data} />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            数据来源：DefiLlama · FRED DTB3 | 每小时更新
          </p>
        </>
      )}
    </div>
  )
}
