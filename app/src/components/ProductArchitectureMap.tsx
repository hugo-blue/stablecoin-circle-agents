'use client'

import type { ProductNode } from '@/types'

interface ProductArchitectureMapProps {
  nodes: ProductNode[]
}

const LAYER_CONFIG = {
  application: { label: '应用层', color: 'border-purple-300 bg-purple-50', textColor: 'text-purple-700' },
  network: { label: '网络层', color: 'border-blue-300 bg-blue-50', textColor: 'text-blue-700' },
  infra: { label: '基础设施', color: 'border-emerald-300 bg-emerald-50', textColor: 'text-emerald-700' },
  asset: { label: '资产层', color: 'border-amber-300 bg-amber-50', textColor: 'text-amber-700' },
} as const

const LAYER_ORDER: (keyof typeof LAYER_CONFIG)[] = ['application', 'network', 'infra', 'asset']

const STATUS_BADGE = {
  live: { label: 'live', className: 'bg-green-100 text-green-700' },
  testnet: { label: 'testnet', className: 'bg-amber-100 text-amber-700' },
  'coming-soon': { label: 'coming soon', className: 'bg-gray-100 text-gray-500' },
} as const

export function ProductArchitectureMap({ nodes }: ProductArchitectureMapProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Circle 产品架构</h3>

      <div className="space-y-3">
        {LAYER_ORDER.map(layer => {
          const config = LAYER_CONFIG[layer]
          const layerNodes = nodes.filter(n => n.layer === layer)
          if (layerNodes.length === 0) return null

          return (
            <div key={layer} className="flex items-stretch gap-3">
              {/* Layer label */}
              <div className={`w-20 shrink-0 flex items-center justify-center rounded-lg ${config.color} border`}>
                <span className={`text-xs font-semibold ${config.textColor} text-center leading-tight`}>
                  {config.label}
                </span>
              </div>

              {/* Nodes */}
              <div className="flex-1 flex flex-wrap gap-2">
                {layerNodes.map(node => (
                  <div
                    key={node.id}
                    className={`flex-1 min-w-[140px] rounded-lg border p-3 ${config.color}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900">{node.name}</span>
                      {node.status !== 'live' && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[node.status].className}`}>
                          {STATUS_BADGE[node.status].label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{node.nameCn}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-gray-400">{node.metricLabel}</span>
                      <span className="text-sm font-semibold text-gray-800">{node.metricValue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Connection arrows description */}
      <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-4">
        <span>资产层 → 基础设施 → 网络层 → 应用层（自下而上依赖）</span>
        <span className="ml-auto">数据来源：Circle 官方文档 + SEC 财报</span>
      </div>
    </div>
  )
}
