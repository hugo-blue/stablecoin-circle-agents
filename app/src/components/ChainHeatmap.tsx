'use client'

import { formatUSD } from '@/lib/format'
import type { ChainDistribution } from '@/types'

interface ChainHeatmapProps {
  data: ChainDistribution[]
  isLoading?: boolean
}

const TOP_CHAINS = ['Ethereum', 'Tron', 'Solana', 'BSC', 'Arbitrum', 'Base', 'Polygon']
const TOP_SYMBOLS = ['USDT', 'USDC', 'DAI', 'FDUSD']

function getHeatColor(pct: number): string {
  if (pct > 50) return 'bg-blue-700 text-white'
  if (pct > 20) return 'bg-blue-500 text-white'
  if (pct > 10) return 'bg-blue-400 text-white'
  if (pct > 5) return 'bg-blue-300 text-gray-800'
  if (pct > 1) return 'bg-blue-200 text-gray-700'
  if (pct > 0) return 'bg-blue-100 text-gray-600'
  return 'bg-gray-50 text-gray-400'
}

export function ChainHeatmap({ data, isLoading }: ChainHeatmapProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Build lookup map
  const lookup = new Map<string, ChainDistribution>()
  for (const d of data) {
    lookup.set(`${d.symbol}-${d.chain}`, d)
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 overflow-x-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">各链分布热力图</h3>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-2 px-2 text-gray-500 font-medium">链</th>
            {TOP_SYMBOLS.map(s => (
              <th key={s} className="text-center py-2 px-2 text-gray-500 font-medium">{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TOP_CHAINS.map(chain => (
            <tr key={chain}>
              <td className="py-2 px-2 font-medium text-gray-700">{chain}</td>
              {TOP_SYMBOLS.map(symbol => {
                const d = lookup.get(`${symbol}-${chain}`)
                const pct = d?.pctOfTotal || 0
                const val = d?.supplyUsd || 0
                return (
                  <td key={symbol} className="py-1 px-1">
                    <div
                      className={`rounded px-2 py-2 text-center text-xs ${getHeatColor(pct)}`}
                      title={`${formatUSD(val)} (${pct.toFixed(1)}%)`}
                    >
                      {val > 0 ? formatUSD(val) : '—'}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
