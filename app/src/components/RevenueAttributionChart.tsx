'use client'

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ComposedChart, Line, Cell, PieChart, Pie,
} from 'recharts'
import { formatUSD, formatUSDFull } from '@/lib/format'
import {
  Q4_2025_ATTRIBUTION,
  OTHER_REVENUE_BREAKDOWN_Q4_2025,
  calcReserveIncome,
  calcCCTPRevenue,
  calcCPNRevenue,
  calcRateSensitivity,
} from '@/lib/data/revenue-attribution'

type ViewMode = 'waterfall' | 'products' | 'sensitivity'

interface LiveRateData {
  rate: number
  date: string
  estimatedReserveIncome: {
    daily: number
    quarterly: number
    annual: number
  }
}

export function RevenueAttributionChart() {
  const [view, setView] = useState<ViewMode>('waterfall')
  const [liveRate, setLiveRate] = useState<LiveRateData | null>(null)

  useEffect(() => {
    fetch('/api/rates/treasury')
      .then(r => r.json())
      .then(json => {
        if (json.data?.latest) {
          setLiveRate({
            rate: json.data.latest.rate,
            date: json.data.latest.date,
            estimatedReserveIncome: json.data.estimatedReserveIncome,
          })
        }
      })
      .catch(() => {})
  }, [])

  const q4 = Q4_2025_ATTRIBUTION
  const rateChange = liveRate ? Math.round((liveRate.rate - q4.reserveIncome.returnRate) * 10000) : null

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">收入归因模型</h3>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-xs text-gray-500">
              Q4 2025: ${(q4.totalRevenue / 1e6).toFixed(0)}M 总收入 | RLDC {q4.rldcMarginPct}%
            </p>
            {liveRate && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                3M T-Bill {(liveRate.rate * 100).toFixed(2)}%
                {rateChange !== null && rateChange !== 0 && (
                  <span className={rateChange > 0 ? 'text-green-600' : 'text-red-500'}>
                    {rateChange > 0 ? ' ↑' : ' ↓'}{Math.abs(rateChange)}bps vs Q4
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          {([
            { key: 'waterfall' as const, label: '收入瀑布' },
            { key: 'products' as const, label: '产品归因' },
            { key: 'sensitivity' as const, label: '利率敏感度' },
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

      {view === 'waterfall' && <WaterfallView liveRate={liveRate} />}
      {view === 'products' && <ProductsView />}
      {view === 'sensitivity' && <SensitivityView liveRate={liveRate} />}

      <p className="text-xs text-gray-400 mt-3">
        数据来源：SEC 10-K FY2025 + Q4 2025 财报电话会 | 产品费率为估算值
      </p>
    </div>
  )
}

function WaterfallView({ liveRate }: { liveRate: LiveRateData | null }) {
  const q4 = Q4_2025_ATTRIBUTION

  const data = [
    { name: '储备利息（总）', value: q4.reserveIncome.gross, fill: '#2962ff' },
    { name: 'Coinbase 分成', value: -q4.reserveIncome.distributionCosts, fill: '#e91e63' },
    { name: '储备利息（净）', value: q4.reserveIncome.net, fill: '#1565c0' },
    { name: '订阅/服务收入', value: q4.otherRevenue.subscriptionServices, fill: '#f5ac37' },
    { name: '交易费收入', value: q4.otherRevenue.transactionRevenue, fill: '#26a69a' },
  ]

  return (
    <>
      <div className="grid grid-cols-3 gap-3 my-4">
        <div className="rounded-lg bg-blue-50 px-3 py-2">
          <p className="text-xs text-gray-500">储备利息（总）</p>
          <p className="text-lg font-semibold text-blue-700">{formatUSD(q4.reserveIncome.gross)}</p>
          <p className="text-xs text-gray-400">
            Q4利率 {(q4.reserveIncome.returnRate * 100).toFixed(2)}%
            {liveRate && (
              <> · 实时预测 {formatUSD(liveRate.estimatedReserveIncome.quarterly)}</>
            )}
          </p>
        </div>
        <div className="rounded-lg bg-red-50 px-3 py-2">
          <p className="text-xs text-gray-500">渠道分成</p>
          <p className="text-lg font-semibold text-red-600">-{formatUSD(q4.reserveIncome.distributionCosts)}</p>
          <p className="text-xs text-gray-400">{q4.reserveIncome.distributionPctOfReserve}% of 利息</p>
        </div>
        <div className="rounded-lg bg-green-50 px-3 py-2">
          <p className="text-xs text-gray-500">其他收入</p>
          <p className="text-lg font-semibold text-green-700">{formatUSD(q4.otherRevenue.total)}</p>
          <p className="text-xs text-gray-400">FY26 指引 $150-170M</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#111827' }} tickFormatter={(v: number) => formatUSD(Math.abs(v))} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#111827', fontWeight: 500 }} width={110} />
          <Tooltip
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null
              const val = payload[0].value
              return (
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
                  <p className="font-bold text-gray-900">{payload[0].payload.name}</p>
                  <p className={`font-semibold ${val >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                    {val < 0 ? '-' : ''}{formatUSDFull(Math.abs(val))}
                  </p>
                </div>
              )
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </>
  )
}

function ProductsView() {
  // Estimate revenue per product
  const cctp = calcCCTPRevenue({
    totalVolume: 41_300_000_000,
    fastTransferPct: 0.40,
    avgFastFeeBps: 2.0,
  })

  const cpn = calcCPNRevenue({
    annualizedTpv: 5_700_000_000,
    avgFeeBps: 10,
  })

  const otherRev = OTHER_REVENUE_BREAKDOWN_Q4_2025

  const productData = [
    { name: '链合作费', value: otherRev.subscription.components.blockchainPartnershipFees, fill: '#f5ac37', note: '链付费部署USDC' },
    { name: 'CCTP 费用', value: cctp.estimatedRevenue, fill: '#2962ff', note: `${cctp.impliedTakeRate.toFixed(1)}bps 有效费率` },
    { name: 'Mint 赎回费', value: otherRev.transaction.components.mintFastRedemptionFees, fill: '#26a69a', note: '快速赎回 0.03-0.10%' },
    { name: 'CPN 网络费', value: cpn.quarterlyRevenue, fill: '#7c4dff', note: `~10bps × $${(cpn.annualizedTpv / 1e9).toFixed(1)}B TPV` },
    { name: 'USYC 管理费', value: otherRev.subscription.components.usycManagementFees, fill: '#ff6f00', note: '$1.5B AUM' },
    { name: 'Canton (一次性)', value: otherRev.transaction.components.cantonCoinTrading, fill: '#bdbdbd', note: '不可持续' },
  ]

  const pieData = productData.filter(d => d.name !== 'Canton (一次性)')

  return (
    <div className="my-4">
      <div className="text-xs bg-amber-50 text-amber-700 rounded px-3 py-2 mb-4">
        以下为基于公开费率和财报数据的估算模型。精确收入拆分未在 SEC 文件中披露。
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart */}
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={productData} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#111827' }} tickFormatter={(v: number) => `$${(v / 1e6).toFixed(1)}M`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#111827', fontWeight: 500 }} width={90} />
            <Tooltip
              content={({ active, payload }: any) => {
                if (!active || !payload?.length) return null
                const item = payload[0].payload
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
                    <p className="font-bold text-gray-900">{item.name}</p>
                    <p className="font-semibold text-blue-700">{formatUSDFull(item.value)}</p>
                    <p className="text-xs text-gray-700 mt-1">{item.note}</p>
                  </div>
                )
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {productData.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Details */}
        <div className="space-y-2">
          {productData.map(d => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: d.fill }} />
              <span className="font-medium text-gray-700 w-24">{d.name}</span>
              <span className="font-semibold text-gray-900">${(d.value / 1e6).toFixed(1)}M</span>
              <span className="text-gray-400 ml-auto">{d.note}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-gray-100 text-xs">
            <p className="font-medium text-gray-700">
              Q4 其他收入合计: <span className="text-gray-900">${(OTHER_REVENUE_BREAKDOWN_Q4_2025.total / 1e6).toFixed(1)}M</span>
            </p>
            <p className="text-gray-400 mt-1">
              占总收入 {(OTHER_REVENUE_BREAKDOWN_Q4_2025.total / Q4_2025_ATTRIBUTION.totalRevenue * 100).toFixed(1)}%
              — 95%+ 仍来自储备利息
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SensitivityView({ liveRate }: { liveRate: LiveRateData | null }) {
  // Base rate: use live T-bill rate if available, otherwise Q4 2025 actuals
  const baseRate = liveRate?.rate ?? 0.0381
  const baseLabel = liveRate ? `当前 (${(baseRate * 100).toFixed(2)}%)` : '当前 Q4 (3.81%)'

  const scenarios = [
    { label: '+50bps', bps: 50 },
    { label: '+25bps', bps: 25 },
    { label: baseLabel, bps: 0 },
    { label: '-25bps', bps: -25 },
    { label: '-50bps', bps: -50 },
    { label: '-100bps', bps: -100 },
    { label: '-150bps', bps: -150 },
    { label: '-200bps', bps: -200 },
  ]

  const data = scenarios.map(s => {
    const result = calcRateSensitivity({
      avgCirculation: 76_200_000_000,
      currentRate: baseRate,
      rateChangeBps: s.bps,
      rldcMargin: 0.39,
    })
    return {
      scenario: s.label,
      rate: `${(result.newRate * 100).toFixed(2)}%`,
      netImpact: result.netAnnualImpact,
      growthNeeded: result.growthPctToOffset,
      isCurrent: s.bps === 0,
    }
  })

  return (
    <div className="my-4">
      <div className="text-xs bg-red-50 text-red-700 rounded px-3 py-2 mb-4">
        每降息 100bps，Circle 年净收入减少约 $297M。盈亏平衡利率约 2.0-2.5%。
        {liveRate
          ? `当前 3M T-Bill ${(liveRate.rate * 100).toFixed(2)}% (${liveRate.date})，预计季度储备收入 ${formatUSD(liveRate.estimatedReserveIncome.quarterly)}。`
          : '当前美联储利率 ~3.5%，有缓冲但需关注。'
        }
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="scenario" tick={{ fontSize: 11, fill: '#111827' }} />
          <YAxis tick={{ fontSize: 11, fill: '#111827' }} tickFormatter={(v: number) => `$${(v / 1e6).toFixed(0)}M`} />
          <Tooltip
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              return (
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
                  <p className="font-bold text-gray-900">{d.scenario} → 利率 {d.rate}</p>
                  <p className={`font-semibold ${d.netImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    年净影响: {formatUSDFull(d.netImpact)}
                  </p>
                  {d.netImpact < 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      需 USDC 增长 {d.growthNeeded}% 来对冲
                    </p>
                  )}
                </div>
              )
            }}
          />
          <Bar dataKey="netImpact" name="年净影响" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.netImpact >= 0 ? '#26a69a' : '#e91e63'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Table */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-gray-100">
              <th className="text-left py-1 font-medium">场景</th>
              <th className="text-right py-1 font-medium">储备利率</th>
              <th className="text-right py-1 font-medium">年净影响</th>
              <th className="text-right py-1 font-medium">需 USDC 增长</th>
            </tr>
          </thead>
          <tbody>
            {data.map(d => (
              <tr key={d.scenario} className={`border-b border-gray-50 ${d.isCurrent ? 'bg-blue-50 font-semibold' : ''}`}>
                <td className="py-1 text-gray-700">{d.scenario}</td>
                <td className="py-1 text-right text-gray-700">{d.rate}</td>
                <td className={`py-1 text-right ${d.netImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {d.netImpact >= 0 ? '+' : ''}{formatUSD(d.netImpact)}
                </td>
                <td className="py-1 text-right text-gray-500">
                  {d.netImpact < 0 ? `${d.growthNeeded}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
