'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ComposedChart, Line,
} from 'recharts'
import { formatUSD, formatUSDFull } from '@/lib/format'
import { ONCHAIN_VOLUME_MONTHLY, ONCHAIN_VOLUME_ANNUAL, VOLUME_DRIVERS } from '@/lib/data/volume-onchain'
import type { StablecoinVolume } from '@/types'

interface VolumeComparisonChartProps {
  tradingVolumes?: StablecoinVolume[]
  isLoading?: boolean
}

type ViewMode = 'onchain' | 'trading' | 'insight'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm min-w-48">
      <p className="font-medium text-gray-900 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex justify-between gap-4">
          <span className="font-medium" style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold text-gray-900">{formatUSDFull(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export function VolumeComparisonChart({ tradingVolumes, isLoading }: VolumeComparisonChartProps) {
  const [view, setView] = useState<ViewMode>('onchain')

  const onchainData = ONCHAIN_VOLUME_MONTHLY.map(d => {
    const total = d.usdcVolumeUsd + d.usdtVolumeUsd
    return {
      date: d.month,
      USDC: d.usdcVolumeUsd,
      USDT: d.usdtVolumeUsd,
      usdcSharePct: Math.round(d.usdcVolumeUsd / total * 1000) / 10,
    }
  })

  const tradingData = buildTradingData(tradingVolumes)

  const latest = ONCHAIN_VOLUME_MONTHLY[ONCHAIN_VOLUME_MONTHLY.length - 1]
  const usdcShare = latest
    ? Math.round(latest.usdcVolumeUsd / (latest.usdcVolumeUsd + latest.usdtVolumeUsd) * 1000) / 10
    : 0

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">USDC vs USDT 交易量深度对比</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            链上转账量 USDC 已超越 USDT | 交易所成交量 USDT 仍然领先
          </p>
        </div>
        <div className="flex gap-1">
          {([
            { key: 'onchain' as const, label: '链上转账' },
            { key: 'trading' as const, label: '交易所成交' },
            { key: 'insight' as const, label: '差异分析' },
          ]).map(m => (
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
        <div className="rounded-lg bg-blue-50 px-3 py-2 border border-blue-100">
          <p className="text-xs text-blue-600 font-medium">USDC 链上占比</p>
          <p className="text-xl font-bold text-blue-700">{usdcShare}%</p>
          <p className="text-xs text-blue-500">2026-02 调整后</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-600 font-medium">USDC 2025 链上</p>
          <p className="text-lg font-bold text-gray-900">{formatUSD(ONCHAIN_VOLUME_ANNUAL[2025].usdc)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-600 font-medium">USDT 2025 链上</p>
          <p className="text-lg font-bold text-gray-900">{formatUSD(ONCHAIN_VOLUME_ANNUAL[2025].usdt)}</p>
        </div>
        <div className="rounded-lg bg-green-50 px-3 py-2 border border-green-100">
          <p className="text-xs text-green-600 font-medium">USDC 领先</p>
          <p className="text-xl font-bold text-green-700">+{formatUSD(ONCHAIN_VOLUME_ANNUAL[2025].usdc - ONCHAIN_VOLUME_ANNUAL[2025].usdt)}</p>
        </div>
      </div>

      {/* Chart area */}
      {view === 'onchain' && (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={onchainData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#111827' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#111827' }} tickFormatter={(v: number) => formatUSD(v)} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#111827' }} tickFormatter={(v: number) => `${v}%`} domain={[30, 80]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#111827' }} />
            <Bar yAxisId="left" dataKey="USDC" name="USDC 链上量" fill="#2962ff" radius={[3, 3, 0, 0]} />
            <Bar yAxisId="left" dataKey="USDT" name="USDT 链上量" fill="#78909c" radius={[3, 3, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="usdcSharePct" name="USDC 占比%" stroke="#e91e63" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {view === 'trading' && (
        <>
          {isLoading ? (
            <div className="h-[300px] bg-gray-50 rounded animate-pulse flex items-center justify-center">
              <p className="text-sm text-gray-400">加载交易所数据…</p>
            </div>
          ) : tradingData.length > 0 ? (
            <>
              <div className="text-xs bg-amber-50 text-amber-700 rounded px-3 py-2 mb-3">
                交易所成交量中 USDT 远超 USDC——因为全球 90%+ 交易对以 USDT 计价（BTC/USDT 等）。
                这反映的是 USDT 作为"交易计价单位"的网络效应，而非链上实际资金流动。
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={tradingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#111827' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#111827' }} tickFormatter={(v: number) => formatUSD(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#111827' }} />
                  <Bar dataKey="USDC" name="USDC" fill="#2962ff" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="USDT" name="USDT" fill="#78909c" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="h-[300px] bg-gray-50 rounded flex items-center justify-center">
              <p className="text-sm text-gray-400">交易所数据暂无</p>
            </div>
          )}
        </>
      )}

      {view === 'insight' && <InsightView />}

      {/* Source */}
      <p className="text-xs text-gray-400 mt-3">
        {view === 'onchain' && '链上调整后转账量（排除机器人/非经济活动）| 来源：Mizuho Research'}
        {view === 'trading' && '交易所24h成交量（含所有交易对）| 来源：CoinGecko'}
        {view === 'insight' && '综合分析 | 来源：Mizuho Research, CoinGecko, Circle 财报'}
      </p>
    </div>
  )
}

/** Deep insight view explaining the volume divergence */
function InsightView() {
  const comparisons = [
    {
      dimension: '链上转账量（调整后）',
      usdc: '$18.3T (2025)',
      usdt: '$13.2T (2025)',
      winner: 'USDC',
      why: 'DeFi、企业支付、AI Agent、跨境结算等真实经济活动',
    },
    {
      dimension: '交易所成交量',
      usdc: '~$5-8B/天',
      usdt: '~$50-80B/天',
      winner: 'USDT',
      why: '全球 90%+ CEX 交易对用 USDT 计价，网络效应极强',
    },
    {
      dimension: '市值',
      usdc: '$78B',
      usdt: '$145B',
      winner: 'USDT',
      why: 'USDT 在新兴市场（亚洲、非洲、拉美）渗透率高',
    },
    {
      dimension: '美国合规场景',
      usdc: '主导',
      usdt: '边缘',
      winner: 'USDC',
      why: 'GENIUS Act 利好合规发行商，Coinbase/Circle 美国本土优势',
    },
    {
      dimension: 'AI Agent 支付',
      usdc: '98.6%',
      usdt: '<2%',
      winner: 'USDC',
      why: 'x402 协议、Nanopayments 均基于 USDC，Base 链是主要阵地',
    },
  ]

  return (
    <div className="my-4 space-y-4">
      {/* Core insight */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-blue-900 mb-2">核心洞察：两种不同的"交易量"</p>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="font-semibold text-blue-800 mb-1">USDT = "交易货币"</p>
            <p className="text-blue-700">USDT 是全球 CEX 的计价标准。每一笔 BTC/USDT 交易都计入 USDT 成交量，但 USDT 并没有在链上移动。这是<strong>交易对网络效应</strong>，短期几乎不可替代。</p>
          </div>
          <div>
            <p className="font-semibold text-blue-800 mb-1">USDC = "结算货币"</p>
            <p className="text-blue-700">USDC 在链上被用于 DeFi 借贷、企业付款、AI Agent 调用、跨境结算。链上转账量反映的是<strong>真实经济活动</strong>，直接关联 Circle 的收入增长。</p>
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 font-semibold text-gray-900">维度</th>
              <th className="text-center py-2 font-semibold text-blue-700">USDC</th>
              <th className="text-center py-2 font-semibold text-gray-600">USDT</th>
              <th className="text-left py-2 font-semibold text-gray-900">原因</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map(c => (
              <tr key={c.dimension} className="border-b border-gray-100">
                <td className="py-2 font-medium text-gray-800">{c.dimension}</td>
                <td className={`py-2 text-center font-semibold ${c.winner === 'USDC' ? 'text-blue-700 bg-blue-50' : 'text-gray-600'}`}>
                  {c.usdc}
                </td>
                <td className={`py-2 text-center font-semibold ${c.winner === 'USDT' ? 'text-gray-800 bg-gray-50' : 'text-gray-500'}`}>
                  {c.usdt}
                </td>
                <td className="py-2 text-gray-500">{c.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* What this means for Circle */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-green-900 mb-2">对 Circle 的商业意义</p>
        <div className="space-y-1.5 text-xs text-green-800">
          <p><strong>链上量 &gt; 交易所量 = 好信号：</strong>链上转账量直接推动 USDC 流通量增长 → 更多储备利息收入。2025年 USDC 流通量增长 72%，与链上交易量增长高度正相关。</p>
          <p><strong>交易所成交量不直接影响收入：</strong>CEX 内部的 USDT 撮合交易不产生链上转账，对 Tether 的储备利息贡献有限。</p>
          <p><strong>AI Agent 是增量：</strong>98.6% 的 AI Agent 支付用 USDC，这是纯增量需求，USDT 几乎不参与这个赛道。</p>
        </div>
      </div>

      {/* Volume drivers */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2">USDC 链上交易量增长驱动因素</p>
        <div className="grid grid-cols-2 gap-2">
          {VOLUME_DRIVERS.map(d => (
            <div key={d.factor} className="text-xs bg-gray-50 rounded px-3 py-2">
              <span className="font-semibold text-gray-800">{d.factor}</span>
              <span className="text-gray-500 ml-1">— {d.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function buildTradingData(volumes?: StablecoinVolume[]) {
  if (!volumes || volumes.length === 0) return []
  const dateMap = new Map<string, { date: string; USDC: number; USDT: number }>()

  for (const sv of volumes) {
    for (const v of sv.volumes) {
      if (!dateMap.has(v.date)) dateMap.set(v.date, { date: v.date, USDC: 0, USDT: 0 })
      const entry = dateMap.get(v.date)!
      if (sv.symbol === 'USDC') entry.USDC = v.volume
      if (sv.symbol === 'USDT') entry.USDT = v.volume
    }
  }

  return Array.from(dateMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((_, i, arr) => i % 7 === 0 || i === arr.length - 1)
}
