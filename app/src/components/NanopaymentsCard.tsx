'use client'

import type { NanopaymentsData } from '@/types'

interface NanopaymentsCardProps {
  data: NanopaymentsData
}

export function NanopaymentsCard({ data }: NanopaymentsCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 opacity-90">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Nanopayments</h3>
          <p className="text-xs text-gray-500 mt-0.5">AI Agent 微支付原语 | 无 Gas 亚分级支付</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold">
          Testnet
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500">支持链数</p>
          <p className="text-xl font-semibold text-gray-900">{data.supportedChains}</p>
          <p className="text-xs text-gray-400">测试网</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500">最小支付</p>
          <p className="text-xl font-semibold text-gray-900">${data.minPaymentUsd}</p>
          <p className="text-xs text-gray-400">USDC</p>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500">上线时间</p>
          <p className="text-xl font-semibold text-gray-900">{data.launchDate}</p>
          <p className="text-xs text-gray-400">测试网发布</p>
        </div>
      </div>

      {/* Chains */}
      <div className="mb-3">
        <p className="text-xs font-medium text-gray-500 mb-1.5">测试网链</p>
        <div className="flex flex-wrap gap-1">
          {data.chainNames.map(c => (
            <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="text-xs bg-amber-50 text-amber-700 rounded px-3 py-2 mb-3">
        链下签名聚合 + 批量链上结算。Circle 承担 Gas 费用。遵循 x402 支付标准，面向 AI Agent 经济。
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
        <span>GatewayWallet: <code className="text-gray-500">0x7777...00eE</code></span>
        <span>GatewayMinter: <code className="text-gray-500">0x2222...C205</code></span>
      </div>
    </div>
  )
}
