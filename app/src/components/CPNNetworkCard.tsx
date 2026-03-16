'use client'

import { formatUSD } from '@/lib/format'
import type { CPNData } from '@/types'

interface CPNNetworkCardProps {
  data: CPNData
}

export function CPNNetworkCard({ data }: CPNNetworkCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Circle Payments Network</h3>
          <p className="text-xs text-gray-500 mt-0.5">机构跨境支付网络 | 稳定币版 SWIFT</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-green-700">运行中</span>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500">入网机构</p>
          <p className="text-xl font-semibold text-gray-900">{data.enrolledInstitutions}</p>
          <p className="text-xs text-gray-400">{data.inReviewInstitutions} 家审核中</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500">年化 TPV</p>
          <p className="text-xl font-semibold text-gray-900">{formatUSD(data.annualizedTpvUsd)}</p>
          <p className="text-xs text-gray-400">截至 2026-02</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500">结算链</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {data.settlementChains.map(c => (
              <span key={c} className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Partners */}
      <div className="space-y-2">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">实际处理交易</p>
          <div className="flex flex-wrap gap-1.5">
            {data.livePartners.map(p => (
              <span key={p} className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                {p}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">设计合作伙伴</p>
          <div className="flex flex-wrap gap-1.5">
            {data.designPartners.map(p => (
              <span key={p} className="text-xs px-2 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-200">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CPN flow explanation */}
      <div className="mt-4 text-xs bg-blue-50 text-blue-700 rounded px-3 py-2">
        CPN 通过 Permit2 合约在 {data.settlementChains.join('/')} 上结算。终端用户看不到 USDC，银行间直接法币到法币。未来将迁移到 Arc 链。
      </div>

      <p className="text-xs text-gray-400 mt-3">
        上线：{data.launchDate} | PaymentSettlement 合约地址未公开
      </p>
    </div>
  )
}
