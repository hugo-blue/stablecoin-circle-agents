'use client'

export default function AiPaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI 支付生态</h1>
        <p className="text-sm text-gray-500 mt-1">x402 协议、Agent 经济、流式支付追踪</p>
      </div>

      {/* Architecture overview */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">生态架构</h3>
        <div className="space-y-3">
          {[
            { layer: '应用层', desc: 'OpenClaw / ClawHub / A2A Market', status: 'tracking' },
            { layer: '协议层', desc: 'x402（HTTP原生） / Superfluid（流式）', status: 'tracking' },
            { layer: '结算层', desc: 'CDP Facilitator (Base) / PayAI (Solana)', status: 'planned' },
            { layer: '链层', desc: 'Base（主力）/ Solana / Ethereum', status: 'tracking' },
          ].map(item => (
            <div key={item.layer} className="flex items-center gap-4 bg-gray-50 rounded-lg px-4 py-3">
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{item.layer}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                item.status === 'tracking'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {item.status === 'tracking' ? '追踪中' : '规划中'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* M5.1 x402 placeholder */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">x402 协议追踪</h3>
        <p className="text-sm text-gray-500 mb-4">
          通过监控已知 x402 服务商的 payTo 地址，追踪 USDC on Base 的支付数据。
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '日交易笔数', value: '—', note: 'Basescan 接入中' },
            { label: '日交易量', value: '—', note: 'USDC on Base' },
            { label: 'Base vs Solana', value: '—', note: '双链合并' },
            { label: '活跃服务商', value: '—', note: '地址注册表' },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-xl font-semibold text-gray-300 mt-1">{item.value}</p>
              <p className="text-xs text-gray-400 mt-1">{item.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Known x402 providers */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">已知 x402 服务商</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 text-gray-500 font-medium">服务商</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">类型</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">链</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Alchemy Agentic Gateway', type: 'RPC/区块链数据', chain: 'Base', status: '待验证地址' },
                { name: 'CoinGecko x402 API', type: '价格/市场数据', chain: 'Base+Solana', status: '待验证地址' },
                { name: 'Cloudflare Pay-per-Crawl', type: '网页数据', chain: 'Base', status: '待验证地址' },
                { name: 'claw402.ai', type: '综合数据API', chain: 'Base', status: '待验证地址' },
                { name: 'Firecrawl', type: '网页抓取', chain: 'Base', status: '待验证地址' },
              ].map(p => (
                <tr key={p.name} className="border-b border-gray-50">
                  <td className="py-2 px-2 font-medium text-gray-700">{p.name}</td>
                  <td className="py-2 px-2 text-gray-500">{p.type}</td>
                  <td className="py-2 px-2 text-gray-500">{p.chain}</td>
                  <td className="py-2 px-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
