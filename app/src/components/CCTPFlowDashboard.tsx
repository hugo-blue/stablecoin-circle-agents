'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ComposedChart, Line,
} from 'recharts'
import { formatUSD, formatUSDFull } from '@/lib/format'
import type { CCTPMetrics } from '@/types'

interface CCTPFlowDashboardProps {
  data: CCTPMetrics
}

type ViewMode = 'pairs' | 'quarterly'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm min-w-44">
      <p className="font-bold text-gray-900 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex justify-between gap-4">
          <span className="font-medium" style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold text-gray-900">
            {p.dataKey === 'pctOfTotal' ? `${p.value}%` : formatUSDFull(p.value)}
          </span>
        </p>
      ))}
    </div>
  )
}

export function CCTPFlowDashboard({ data }: CCTPFlowDashboardProps) {
  const [view, setView] = useState<ViewMode>('pairs')

  const pairData = data.chainPairs.map(p => ({
    pair: `${p.source} → ${p.target}`,
    volumeUsd: p.volumeUsd,
    txCount: p.txCount,
    pctOfTotal: p.pctOfTotal,
  }))

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">CCTP 跨链转账</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Cross-Chain Transfer Protocol v2 | {data.supportedChains} 条链
          </p>
        </div>
        <div className="flex gap-1">
          {([
            { key: 'pairs', label: '链对流量' },
            { key: 'quarterly', label: '季度趋势' },
          ] as const).map(m => (
            <button
              key={m.key}
              onClick={() => setView(m.key)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                view === m.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
        <MiniMetric label="累计交易量" value={formatUSD(data.cumulativeVolumeUsd)} />
        <MiniMetric label="Q4 2025" value={formatUSD(data.q4VolumeUsd)} sub="YoY +269%" />
        <MiniMetric label="总转账次数" value={`${(data.totalTransfers / 1e6).toFixed(0)}M+`} />
        <MiniMetric label="桥接 USDC 占比" value={`${data.bridgedUsdcPct}%`} />
      </div>

      {/* Chart area */}
      <ResponsiveContainer width="100%" height={300}>
        {view === 'pairs' ? (
          <BarChart data={pairData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#111827' }} tickFormatter={(v: number) => formatUSD(v)} />
            <YAxis type="category" dataKey="pair" tick={{ fontSize: 11, fill: '#111827' }} width={140} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="volumeUsd" name="交易量" fill="#2962ff" radius={[0, 4, 4, 0]} />
          </BarChart>
        ) : (
          <ComposedChart data={data.quarterly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#111827' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#111827' }} tickFormatter={(v: number) => formatUSD(v)} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#111827' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="volumeUsd" name="交易量" fill="#2962ff" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="txCount" name="交易笔数" stroke="#e91e63" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        )}
      </ResponsiveContainer>

      {/* Contract info footer */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
        <span>TokenMessenger: <code className="text-gray-500">0x28b5...cf5d</code></span>
        <span>MessageTransmitter: <code className="text-gray-500">0x81D4...B64</code></span>
        <span className="ml-auto">所有 EVM 链统一地址 | 数据来源：Circle Q4 2025 财报</span>
      </div>
    </div>
  )
}

function MiniMetric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-green-600">{sub}</p>}
    </div>
  )
}
