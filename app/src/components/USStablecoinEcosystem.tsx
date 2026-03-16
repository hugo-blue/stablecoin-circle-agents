'use client'

import { useState } from 'react'
import { ECOSYSTEM_PLAYERS, GENIUS_ACT, STABLECOIN_COMPARISONS } from '@/lib/data/us-stablecoin-ecosystem'
import type { EcosystemPlayer } from '@/types'

type ViewTab = 'map' | 'compare' | 'genius'

const TAB_CONFIG: { key: ViewTab; label: string }[] = [
  { key: 'map', label: '生态地图' },
  { key: 'compare', label: '竞争对比' },
  { key: 'genius', label: 'GENIUS Act' },
]

const RELATION_CONFIG = {
  partner: { label: '合作', borderColor: 'border-green-400', badgeBg: 'bg-green-100 text-green-700' },
  competitor: { label: '竞争', borderColor: 'border-red-400', badgeBg: 'bg-red-100 text-red-700' },
  both: { label: '竞合', borderColor: 'border-yellow-400', badgeBg: 'bg-yellow-100 text-yellow-700' },
  complementary: { label: '互补', borderColor: 'border-blue-400', badgeBg: 'bg-blue-100 text-blue-700' },
} as const

const CATEGORY_CONFIG = {
  issuer: { label: '发行方', color: 'bg-purple-50' },
  bank: { label: '银行', color: 'bg-emerald-50' },
  'card-network': { label: '卡网络', color: 'bg-blue-50' },
  fintech: { label: '金融科技', color: 'bg-amber-50' },
  exchange: { label: '交易所', color: 'bg-pink-50' },
} as const

const STATUS_BADGE = {
  live: { label: 'live', className: 'bg-green-100 text-green-700' },
  early: { label: 'early', className: 'bg-amber-100 text-amber-700' },
  announced: { label: 'announced', className: 'bg-gray-100 text-gray-500' },
} as const

const CATEGORY_ORDER: EcosystemPlayer['category'][] = ['issuer', 'exchange', 'card-network', 'fintech', 'bank']

function PlayerCard({ player }: { player: EcosystemPlayer }) {
  const relation = RELATION_CONFIG[player.circleRelation]
  const status = STATUS_BADGE[player.status]
  return (
    <div className={`rounded-lg border-2 ${relation.borderColor} p-3 min-w-[180px] flex-1`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="font-semibold text-sm text-gray-900">{player.name}</span>
        {player.status !== 'live' && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${status.className}`}>
            {status.label}
          </span>
        )}
      </div>
      {player.stablecoin && (
        <p className="text-xs text-gray-500 mb-1">{player.stablecoin}{player.marketCapUsd ? ` — ${player.keyMetricValue}` : ''}</p>
      )}
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-xs text-gray-400">{player.keyMetric}</span>
        <span className="text-sm font-semibold text-gray-800">{player.keyMetricValue}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${relation.badgeBg}`}>
          {relation.label}
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{player.circleRelationDetail}</p>
    </div>
  )
}

function EcosystemMapView() {
  return (
    <div className="space-y-4">
      {/* Circle at center */}
      <div className="flex justify-center mb-2">
        <div className="rounded-xl border-2 border-green-400 bg-green-50 px-6 py-3 text-center">
          <p className="font-bold text-gray-900 text-lg">Circle / USDC</p>
          <p className="text-sm text-gray-600">$78B 市值 | 生态中心</p>
        </div>
      </div>

      {CATEGORY_ORDER.map(category => {
        const config = CATEGORY_CONFIG[category]
        const players = ECOSYSTEM_PLAYERS.filter(p => p.category === category && p.id !== 'circle-usdc')
        if (players.length === 0) return null
        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-semibold px-2 py-1 rounded ${config.color} text-gray-700`}>
                {config.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {players.map(player => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>
          </div>
        )
      })}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
        {Object.entries(RELATION_CONFIG).map(([key, config]) => (
          <span key={key} className="flex items-center gap-1">
            <span className={`w-3 h-3 rounded border-2 ${config.borderColor}`} />
            {config.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function ComparisonView() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500 w-32">指标</th>
            {STABLECOIN_COMPARISONS.map(c => (
              <th key={c.symbol} className="text-left py-2 px-2 text-xs font-semibold text-gray-900">
                {c.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {([
            ['市值', 'marketCap'],
            ['日交易量', 'dailyVolume'],
            ['支持链', 'supportedChains'],
            ['合规状态', 'complianceStatus'],
            ['美国监管', 'usRegulatoryPosition'],
            ['核心用例', 'keyUseCase'],
          ] as const).map(([label, key]) => (
            <tr key={key} className="border-b border-gray-50">
              <td className="py-2 px-2 text-xs font-medium text-gray-500">{label}</td>
              {STABLECOIN_COMPARISONS.map(c => (
                <td key={c.symbol} className="py-2 px-2 text-xs text-gray-700">
                  {c[key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GeniusActView() {
  const signed = new Date(GENIUS_ACT.signedDate)
  const effective = new Date(GENIUS_ACT.effectiveDate)
  const now = new Date()
  const totalDays = Math.ceil((effective.getTime() - signed.getTime()) / (1000 * 60 * 60 * 24))
  const elapsedDays = Math.ceil((now.getTime() - signed.getTime()) / (1000 * 60 * 60 * 24))
  const remainingDays = Math.max(0, Math.ceil((effective.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  const progressPct = Math.min(100, Math.round((elapsedDays / totalDays) * 100))

  return (
    <div className="space-y-4">
      {/* Timeline / countdown */}
      <div className="rounded-lg bg-blue-50 p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">GENIUS Act 生效倒计时</p>
            <p className="text-xs text-gray-500">签署: {GENIUS_ACT.signedDate} | 生效: {GENIUS_ACT.effectiveDate}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-700">{remainingDays}</p>
            <p className="text-xs text-gray-500">天</p>
          </div>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>签署 {GENIUS_ACT.signedDate}</span>
          <span>生效 {GENIUS_ACT.effectiveDate}</span>
        </div>
      </div>

      {/* Key provisions */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">核心条款</h4>
        <ul className="space-y-1.5">
          {GENIUS_ACT.keyProvisions.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      {/* Winners and losers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold text-green-700 mb-2">受益方</h4>
          <div className="space-y-2">
            {GENIUS_ACT.winners.map(w => (
              <div key={w.name} className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-sm font-semibold text-gray-900">{w.name}</p>
                <p className="text-xs text-gray-600 mt-0.5">{w.reason}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-red-700 mb-2">受损方</h4>
          <div className="space-y-2">
            {GENIUS_ACT.losers.map(l => (
              <div key={l.name} className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-semibold text-gray-900">{l.name}</p>
                <p className="text-xs text-gray-600 mt-0.5">{l.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Impact on each player */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">各参与方影响评估</h4>
        <div className="flex flex-wrap gap-2">
          {ECOSYSTEM_PLAYERS.map(p => {
            const impactConfig = {
              positive: 'bg-green-100 text-green-700',
              negative: 'bg-red-100 text-red-700',
              neutral: 'bg-gray-100 text-gray-600',
            }
            const impactLabel = {
              positive: '利好',
              negative: '利空',
              neutral: '中性',
            }
            return (
              <span
                key={p.id}
                className={`text-xs px-2 py-1 rounded-full font-medium ${impactConfig[p.geniusActImpact]}`}
              >
                {p.name}: {impactLabel[p.geniusActImpact]}
              </span>
            )
          })}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        数据来源：Congress.gov, Circle SEC 财报, 公开报道 | 更新: 2026-03-16
      </p>
    </div>
  )
}

export function USStablecoinEcosystem() {
  const [activeTab, setActiveTab] = useState<ViewTab>('map')

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">美国稳定币生态全景</h3>
        <div className="flex gap-1">
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'map' && <EcosystemMapView />}
      {activeTab === 'compare' && <ComparisonView />}
      {activeTab === 'genius' && <GeniusActView />}
    </div>
  )
}
