'use client'

import { useState, useEffect } from 'react'
import { MetricCard } from '@/components/MetricCard'
import { ChainHeatmap } from '@/components/ChainHeatmap'
import { MintBurnChart } from '@/components/MintBurnChart'
import { MarketShareChart } from '@/components/MarketShareChart'
import type { StablecoinMarket, ChainDistribution, MultiCoinFlow } from '@/types'

export default function HomePage() {
  const [markets, setMarkets] = useState<StablecoinMarket[]>([])
  const [chains, setChains] = useState<ChainDistribution[]>([])
  const [mintBurn, setMintBurn] = useState<MultiCoinFlow[]>([])
  const [marketShare, setMarketShare] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    // Fetch realtime data (CoinGecko + DefiLlama current)
    async function fetchRealtime() {
      try {
        const [marketsRes, chainsRes] = await Promise.all([
          fetch('/api/stablecoins'),
          fetch('/api/market/chains'),
        ])
        const marketsData = await marketsRes.json()
        const chainsData = await chainsRes.json()
        if (marketsData.data) setMarkets(marketsData.data)
        if (chainsData.data) setChains(chainsData.data)
      } catch (err) {
        console.error('Failed to fetch realtime data:', err)
      } finally {
        setLoading(false)
      }
    }

    // Fetch historical data (DefiLlama charts - slower, separate loading)
    async function fetchHistory() {
      try {
        const res = await fetch('/api/market/history')
        const data = await res.json()
        if (data.data) {
          setMarketShare(data.data.marketShare || [])
          setMintBurn(data.data.mintBurn || [])
        }
      } catch (err) {
        console.error('Failed to fetch history data:', err)
      } finally {
        setHistoryLoading(false)
      }
    }

    fetchRealtime()
    fetchHistory()

    const realtimeInterval = setInterval(fetchRealtime, 60000)
    return () => clearInterval(realtimeInterval)
  }, [])

  const totalMarketCap = markets.reduce((s, m) => s + m.marketCap, 0)

  const usdt = markets.find(m => m.symbol === 'USDT')
  const usdc = markets.find(m => m.symbol === 'USDC')
  const dai = markets.find(m => m.symbol === 'DAI')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">宏观全景</h1>
        <p className="text-sm text-gray-500 mt-1">稳定币市场实时数据</p>
      </div>

      {/* M1.1 核心指标卡 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="稳定币总市值" value={totalMarketCap} isLoading={loading} />
        <MetricCard label="USDT 市值" value={usdt?.marketCap || null} change24h={usdt?.priceChange24h} isLoading={loading} />
        <MetricCard label="USDC 市值" value={usdc?.marketCap || null} change24h={usdc?.priceChange24h} isLoading={loading} />
        <MetricCard label="DAI 市值" value={dai?.marketCap || null} change24h={dai?.priceChange24h} isLoading={loading} />
      </div>

      {/* Price depeg indicator */}
      {markets.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {markets.map(m => {
            const depeg = Math.abs(m.price - 1.0) > 0.005
            return (
              <div
                key={m.id}
                className={`rounded-lg px-4 py-3 text-sm flex items-center justify-between ${
                  depeg ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
                }`}
              >
                <span className="font-medium">{m.symbol}</span>
                <span className={depeg ? 'text-red-600 font-semibold' : 'text-green-600'}>
                  ${m.price.toFixed(4)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* M1.2 市占率 + M1.4 Mint/Burn */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MarketShareChart data={marketShare} isLoading={historyLoading} />
        <MintBurnChart data={mintBurn} isLoading={historyLoading} />
      </div>

      {/* M1.3 链分布热力图 */}
      <ChainHeatmap data={chains} isLoading={loading} />
    </div>
  )
}
