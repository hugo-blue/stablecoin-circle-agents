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
  Legend,
  Line,
  ComposedChart,
} from 'recharts'
import { formatUSD, formatUSDFull } from '@/lib/format'
import type { CircleFinancial } from '@/types'

interface CircleFinancialChartProps {
  data: CircleFinancial[]
}

type DisplayMode = 'revenue' | 'costs' | 'margin'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm min-w-48">
      <p className="font-medium text-gray-900 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex justify-between gap-4">
          <span className="font-medium" style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold text-gray-900">
            {p.dataKey === 'netMarginPct' || p.dataKey === 'distributionPct'
              ? `${p.value.toFixed(1)}%`
              : formatUSDFull(p.value)}
          </span>
        </p>
      ))}
    </div>
  )
}

export function CircleFinancialChart({ data }: CircleFinancialChartProps) {
  const [mode, setMode] = useState<DisplayMode>('revenue')

  const chartData = data.map(d => ({
    period: d.period,
    revenueUsd: d.revenueUsd,
    reserveIncomeUsd: d.reserveIncomeUsd,
    otherRevenueUsd: d.otherRevenueUsd,
    distributionCostsUsd: d.distributionCostsUsd,
    netRetainedUsd: d.revenueUsd - d.distributionCostsUsd,
    netIncomeUsd: d.netIncomeUsd,
    netMarginPct: d.netMarginPct,
    distributionPct: d.revenueUsd > 0
      ? Math.round(d.distributionCostsUsd / d.revenueUsd * 1000) / 10
      : 0,
    source: d.source,
  }))

  const latest = data[data.length - 1]
  const prev = data.length > 1 ? data[data.length - 2] : null
  const revenueGrowth = prev
    ? ((latest.revenueUsd - prev.revenueUsd) / prev.revenueUsd * 100).toFixed(1)
    : null
  const latestDistPct = latest.revenueUsd > 0
    ? (latest.distributionCostsUsd / latest.revenueUsd * 100).toFixed(0)
    : null

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Circle 季度财务</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            NYSE: CRCL | 最新：{latest?.period}
            {revenueGrowth && <span className="text-green-600 ml-2">收入环比 +{revenueGrowth}%</span>}
          </p>
        </div>
        <div className="flex gap-1">
          {([
            { key: 'revenue', label: '收入' },
            { key: 'costs', label: '渠道成本' },
            { key: 'margin', label: '利润率' },
          ] as const).map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                mode === m.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key insight callout */}
      {mode === 'costs' && (
        <div className="text-xs bg-amber-50 text-amber-700 rounded px-3 py-2 mb-3">
          渠道成本主要是 Coinbase 分成：Coinbase 上持有的 USDC 获 100% 利息，链下 USDC 50/50 分成。
          2024年 Coinbase 获得 $908M（占总收入 54%）。渠道成本占比：{latestDistPct}%。
        </div>
      )}

      <ResponsiveContainer width="100%" height={300}>
        {mode === 'revenue' ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#111827' }} />
            <YAxis tick={{ fontSize: 11, fill: '#111827' }} tickFormatter={(v: number) => formatUSD(v)} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#111827' }} />
            <Bar dataKey="reserveIncomeUsd" name="储备利息收入" stackId="rev" fill="#2962ff" />
            <Bar dataKey="otherRevenueUsd" name="其他收入" stackId="rev" fill="#f5ac37" />
            <Bar dataKey="netIncomeUsd" name="净利润" fill="#26a69a" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : mode === 'costs' ? (
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#111827' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#111827' }} tickFormatter={(v: number) => formatUSD(v)} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#111827' }} tickFormatter={(v: number) => `${v}%`} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#111827' }} />
            <Bar yAxisId="left" dataKey="distributionCostsUsd" name="渠道分成成本" fill="#e91e63" />
            <Bar yAxisId="left" dataKey="netRetainedUsd" name="Circle 净留存" fill="#26a69a" />
            <Line yAxisId="right" type="monotone" dataKey="distributionPct" name="渠道成本占比" stroke="#ff6f00" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        ) : (
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#111827' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#111827' }} tickFormatter={(v: number) => formatUSD(v)} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#111827' }} tickFormatter={(v: number) => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#111827' }} />
            <Bar yAxisId="left" dataKey="revenueUsd" name="总收入" fill="#2962ff" opacity={0.7} />
            <Line yAxisId="right" type="monotone" dataKey="netMarginPct" name="净利润率" stroke="#e91e63" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        )}
      </ResponsiveContainer>

      {/* Data source footer */}
      <p className="text-xs text-gray-400 mt-2">
        数据来源：Circle S-1 招股书 + SEC 10-Q/10-K | Q2 2025 净利润含 IPO 一次性股权激励费用
      </p>
    </div>
  )
}
