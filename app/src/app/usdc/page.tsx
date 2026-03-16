'use client'

import { useState, useEffect } from 'react'
import { MetricCard } from '@/components/MetricCard'
import { CircleFinancialChart } from '@/components/CircleFinancialChart'
import type { StablecoinMarket, ChainDistribution, MintBurnFlow, StablecoinVolume } from '@/types'
import { formatUSD, formatPercent } from '@/lib/format'
import { CIRCLE_FINANCIALS } from '@/lib/data/circle-financials'
import { CCTP_METRICS, CPN_DATA, NANOPAYMENTS_DATA, PRODUCT_NODES } from '@/lib/data/circle-products'
import { ProductArchitectureMap } from '@/components/ProductArchitectureMap'
import { CCTPFlowDashboard } from '@/components/CCTPFlowDashboard'
import { CPNNetworkCard } from '@/components/CPNNetworkCard'
import { NanopaymentsCard } from '@/components/NanopaymentsCard'
import { VolumeComparisonChart } from '@/components/VolumeComparisonChart'
import { RevenueAttributionChart } from '@/components/RevenueAttributionChart'
import { USStablecoinEcosystem } from '@/components/USStablecoinEcosystem'

export default function UsdcPage() {
  const [markets, setMarkets] = useState<StablecoinMarket[]>([])
  const [chains, setChains] = useState<ChainDistribution[]>([])
  const [mintBurn, setMintBurn] = useState<MintBurnFlow[]>([])
  const [usdcSharePct, setUsdcSharePct] = useState<number | null>(null)
  const [usdcShareChange, setUsdcShareChange] = useState<number | null>(null)
  const [tradingVolumes, setTradingVolumes] = useState<StablecoinVolume[]>([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [volumeLoading, setVolumeLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [marketsRes, chainsRes] = await Promise.all([
          fetch('/api/stablecoins'),
          fetch('/api/market/chains'),
        ])
        const marketsData = await marketsRes.json()
        const chainsData = await chainsRes.json()
        if (marketsData.data) setMarkets(marketsData.data)
        if (chainsData.data) setChains(chainsData.data.filter((d: ChainDistribution) => d.symbol === 'USDC'))
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setLoading(false)
      }
    }

    async function fetchHistory() {
      try {
        const [mbRes, histRes] = await Promise.all([
          fetch('/api/market/mintburn?symbol=USDC'),
          fetch('/api/market/history'),
        ])
        const mbData = await mbRes.json()
        if (mbData.data) setMintBurn(mbData.data)

        // Get market share from DefiLlama (same source as homepage)
        const histData = await histRes.json()
        if (histData.data?.marketShare?.length) {
          const ms = histData.data.marketShare
          const latest = ms[ms.length - 1]
          setUsdcSharePct(latest.USDC as number)
          // 30d change
          if (ms.length > 30) {
            const prev30 = ms[ms.length - 31]
            setUsdcShareChange(Math.round(((latest.USDC as number) - (prev30.USDC as number)) * 100) / 100)
          }
        }
      } catch {}
      finally { setHistoryLoading(false) }
    }

    async function fetchVolumes() {
      try {
        const res = await fetch('/api/market/volume?days=90')
        const data = await res.json()
        if (data.data) setTradingVolumes(data.data)
      } catch {}
      finally { setVolumeLoading(false) }
    }

    fetchData()
    fetchHistory()
    fetchVolumes()
  }, [])

  const usdc = markets.find(m => m.symbol === 'USDC')

  const TOP_CHAINS = ['Ethereum', 'Base', 'Solana', 'Arbitrum', 'Polygon']
  const usdcChains = chains
    .filter(c => TOP_CHAINS.includes(c.chain))
    .sort((a, b) => b.supplyUsd - a.supplyUsd)
  const totalUsdcChains = chains.reduce((s, d) => s + d.supplyUsd, 0)

  // Calculate 30d net flow for USDC
  const last30 = mintBurn.slice(-30)
  const net30d = last30.reduce((s, f) => s + f.netFlowUsd, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">USDC / Circle</h1>
        <p className="text-sm text-gray-500 mt-1">USDC 链上数据与 Circle 财务追踪</p>
      </div>

      {/* M3.1 USDC 链上总览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="USDC 总市值" value={usdc?.marketCap || null} isLoading={loading} />
        <MetricCard label="USDC 价格" value={usdc?.price || null} change24h={usdc?.priceChange24h} isLoading={loading} />
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-16 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-20" />
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-1">市占率</p>
              <p className="text-2xl font-semibold text-gray-900">
                {usdcSharePct != null ? `${usdcSharePct.toFixed(2)}%` : '—'}
              </p>
              {usdcShareChange != null && (
                <p className={`text-sm mt-1 ${usdcShareChange > 0 ? 'text-green-600' : usdcShareChange < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                  {usdcShareChange > 0 ? '+' : ''}{usdcShareChange.toFixed(2)}pp <span className="text-gray-400">30D</span>
                </p>
              )}
            </>
          )}
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          {historyLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-16 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-20" />
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-1">30D 净发行</p>
              <p className={`text-2xl font-semibold ${net30d >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {formatUSD(Math.abs(net30d))}
              </p>
              <p className="text-xs text-gray-400 mt-1">{net30d >= 0 ? '净发行' : '净赎回'}</p>
            </>
          )}
        </div>
      </div>

      {/* 各链分布 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">USDC 各链分布</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {usdcChains.map(c => {
              const pct = totalUsdcChains > 0 ? (c.supplyUsd / totalUsdcChains) * 100 : 0
              return (
                <div key={c.chain} className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium text-gray-700">{c.chain}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                    <span className="absolute inset-0 flex items-center px-3 text-xs font-medium">
                      {formatUSD(c.supplyUsd)} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* USDC Mint/Burn - single coin bar chart */}
      <UsdcMintBurnChart data={mintBurn} isLoading={historyLoading} />

      {/* USDC vs USDT 交易量对比 */}
      <VolumeComparisonChart tradingVolumes={tradingVolumes} isLoading={volumeLoading} />

      {/* Circle 财务 */}
      <CircleFinancialChart data={CIRCLE_FINANCIALS} />

      {/* 收入归因模型 */}
      <RevenueAttributionChart />

      {/* M3.3 Circle 产品生态 */}
      <div className="pt-2">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Circle 产品生态</h2>
        <p className="text-sm text-gray-500 mb-4">产品体系追踪与链上数据</p>
      </div>

      <ProductArchitectureMap nodes={PRODUCT_NODES} />

      <CCTPFlowDashboard data={CCTP_METRICS} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CPNNetworkCard data={CPN_DATA} />
        <NanopaymentsCard data={NANOPAYMENTS_DATA} />
      </div>

      {/* 美国稳定币生态 */}
      <div className="pt-2">
        <h2 className="text-xl font-bold text-gray-900 mb-1">美国稳定币生态</h2>
        <p className="text-sm text-gray-500 mb-4">Circle 在生态中的位置与竞争格局</p>
      </div>
      <USStablecoinEcosystem />
    </div>
  )
}

/** USDC-only net flow chart */
import { useState as useStateInner } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { formatUSDFull } from '@/lib/format'

function UsdcMintBurnChart({ data, isLoading }: { data: MintBurnFlow[], isLoading: boolean }) {
  const [period, setPeriod] = useStateInner<'30D' | '90D' | '1Y'>('30D')

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
        <h3 className="text-lg font-semibold text-gray-900">USDC 发行 vs 赎回</h3>
        <div className="flex gap-1">
          {(['30D', '90D', '1Y'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                period === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={filtered}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatUSD(v)} />
          <Tooltip
            content={({ active, payload, label }: any) => {
              if (!active || !payload?.length) return null
              const val = payload[0]?.value || 0
              return (
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
                  <p className="text-gray-500 mb-1">{label}</p>
                  <p className={`font-semibold ${val >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatUSDFull(val)}
                  </p>
                </div>
              )
            }}
          />
          <ReferenceLine y={0} stroke="#999" />
          <Bar
            dataKey="netFlowUsd"
            fill="#2962ff"
            name="USDC"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
