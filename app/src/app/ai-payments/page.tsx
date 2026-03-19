'use client'

const PROTOCOL_LAYERS = [
  {
    layer: '商务层',
    en: 'Commerce',
    protocol: 'ACP + SPT',
    by: 'Stripe + OpenAI',
    desc: '消费者 agent 购物，ChatGPT Instant Checkout，法币优先',
    partners: ['Microsoft Copilot', 'Anthropic', 'Perplexity', 'Shopify', 'Etsy'],
    color: 'bg-purple-50 border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    dot: 'bg-purple-400',
    live: true,
  },
  {
    layer: '授权层',
    en: 'Authorization',
    protocol: 'AP2',
    by: 'Google Cloud',
    desc: '可验证数字凭证（VDC），定义 agent 消费权限边界，60+ 合作方',
    partners: ['Mastercard', 'Amex', 'PayPal', 'Coinbase', 'MetaMask', 'UnionPay'],
    color: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-400',
    live: false,
  },
  {
    layer: '执行层',
    en: 'Execution',
    protocol: 'x402',
    by: 'Coinbase + Cloudflare',
    desc: 'HTTP 402 原生支付，stablecoin 优先，580+ 项目，1亿+ 笔',
    partners: ['Cloudflare', 'Stripe', 'Base', 'Solana', 'Firecrawl', 'Neynar'],
    color: 'bg-orange-50 border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    dot: 'bg-orange-400',
    live: true,
  },
  {
    layer: '基础链',
    en: 'Base Chain',
    protocol: 'MPP',
    by: 'Tempo (Stripe + Paradigm)',
    desc: '专为高频 M2M 微支付设计，法币+链上双轨，2026年3月上线',
    partners: ['Stripe', 'Paradigm'],
    color: 'bg-gray-50 border-gray-200',
    badge: 'bg-gray-200 text-gray-600',
    dot: 'bg-gray-400',
    live: true,
  },
]

const PARTICIPANTS = [
  {
    category: '协议 & 标准',
    icon: '⬡',
    color: 'text-blue-600',
    items: [
      { name: 'x402', role: '执行层协议', status: '生产可用', by: 'Coinbase', statusColor: 'bg-green-100 text-green-700' },
      { name: 'AP2', role: '授权层协议', status: '规范发布', by: 'Google', statusColor: 'bg-blue-100 text-blue-700' },
      { name: 'ACP / SPT', role: '商务层协议', status: '生产可用', by: 'Stripe', statusColor: 'bg-green-100 text-green-700' },
      { name: 'MPP', role: '底层链协议', status: '主网上线', by: 'Tempo', statusColor: 'bg-green-100 text-green-700' },
    ],
  },
  {
    category: 'Facilitator（结算方）',
    icon: '⬢',
    color: 'text-orange-600',
    items: [
      { name: 'CDP Facilitator', role: 'Base 链，KYT/OFAC 合规', status: '默认推荐', by: 'Coinbase', statusColor: 'bg-orange-100 text-orange-700' },
      { name: 'PayAI', role: '多链：Avalanche/Base/Solana', status: '生产可用', by: 'PayAI', statusColor: 'bg-green-100 text-green-700' },
      { name: 'Primer', role: 'V1 & V2，全 ERC-20 支持', status: '生产可用', by: 'Primer', statusColor: 'bg-green-100 text-green-700' },
      { name: 'OpenFacilitator', role: '开源，免费', status: '生产可用', by: 'Community', statusColor: 'bg-green-100 text-green-700' },
      { name: 'Mogami', role: '开发者友好，免费', status: '生产可用', by: 'Mogami', statusColor: 'bg-green-100 text-green-700' },
    ],
  },
  {
    category: 'Agent 框架 & 钱包',
    icon: '◈',
    color: 'text-purple-600',
    items: [
      { name: 'OpenClaw', role: 'AI Agent 框架，13,700+ skills，开源基金会', status: '社区集成中', by: 'Foundation', statusColor: 'bg-amber-100 text-amber-700' },
      { name: 'Coinbase AgentKit', role: 'Embedded wallet，x402 原生，CDP', status: '生产可用', by: 'Coinbase', statusColor: 'bg-green-100 text-green-700' },
      { name: 'Agentic Wallets', role: 'Agent 专用托管钱包（2026年2月上线）', status: '生产可用', by: 'Coinbase', statusColor: 'bg-green-100 text-green-700' },
      { name: 'Ramp Agent Cards', role: '企业 agent 虚拟 Visa 卡，Web2 动态预算', status: '生产可用', by: 'Ramp', statusColor: 'bg-green-100 text-green-700' },
      { name: 'CoinFello / MetaMask', role: 'OpenClaw skill，ERC-4337 + ERC-7710 委托', status: '已上线', by: 'CoinFello', statusColor: 'bg-green-100 text-green-700' },
    ],
  },
  {
    category: '主要服务商（x402 接入）',
    icon: '◇',
    color: 'text-green-600',
    items: [
      { name: 'Firecrawl', role: '网页抓取 API，LLM-ready 数据', status: 'Base', by: '数据类', statusColor: 'bg-gray-100 text-gray-600' },
      { name: 'Neynar', role: 'Farcaster 社交数据', status: 'Base', by: '数据类', statusColor: 'bg-gray-100 text-gray-600' },
      { name: 'Pinata', role: 'IPFS 存储，无账户上传', status: 'Base', by: '存储类', statusColor: 'bg-gray-100 text-gray-600' },
      { name: 'Bitrefill', role: '礼品卡，免费 Facilitator', status: 'EVM+Solana', by: '电商类', statusColor: 'bg-gray-100 text-gray-600' },
      { name: 'BlockRun.AI', role: 'LLM 网关，主流模型按调用计费', status: 'Base', by: 'AI推理类', statusColor: 'bg-gray-100 text-gray-600' },
    ],
  },
]

const PROTOCOL_COMPARE = [
  { dim: '发起方', x402: 'Coinbase + Cloudflare', ap2: 'Google Cloud', acp: 'Stripe + OpenAI', mpp: 'Stripe + Paradigm' },
  { dim: '结算层', x402: '链上 USDC 为主', ap2: '支付无关（全轨道）', acp: '法币优先', mpp: '法币 + 链上双轨' },
  { dim: '核心场景', x402: 'API/开发者/crypto-native', ap2: '企业级 agent 授权', acp: '消费者 agent 购物', mpp: '高频 M2M 微支付' },
  { dim: '技术成熟度', x402: '生产可用（V2）', ap2: '规范先行，落地慢', acp: '已上线（ChatGPT）', mpp: '主网刚上线' },
  { dim: '需要链上钱包', x402: '是', ap2: '否', acp: '否', mpp: '是' },
  { dim: '互操作', x402: 'AP2 A2A 子协议', ap2: '纳入 x402 子协议', acp: '独立体系', mpp: '跨链设计' },
]

const TRACKING_METRICS = [
  { label: 'x402 日交易笔数', value: '—', note: 'Basescan 接入中', color: 'text-black' },
  { label: 'x402 日交易量', value: '—', note: 'USDC on Base', color: 'text-black' },
  { label: 'Base vs Solana 占比', value: '—', note: '双链合并统计', color: 'text-black' },
  { label: '活跃 Facilitator', value: '30+', note: '已注册地址', color: 'text-black' },
  { label: '生态项目总数', value: '580+', note: 'x402.org 登记', color: 'text-black' },
  { label: '累计支付笔数', value: '1亿+', note: '截至2026年3月', color: 'text-black' },
]

const KNOWN_PROVIDERS = [
  { name: 'Alchemy Agentic Gateway', type: 'RPC / 区块链数据', chain: 'Base', facilitator: 'CDP', status: '待验证地址' },
  { name: 'Firecrawl', type: '网页抓取', chain: 'Base', facilitator: 'CDP', status: '待验证地址' },
  { name: 'Neynar', type: 'Farcaster 社交数据', chain: 'Base', facilitator: 'CDP', status: '待验证地址' },
  { name: 'Pinata', type: 'IPFS 存储', chain: 'Base', facilitator: 'CDP', status: '待验证地址' },
  { name: 'BlockRun.AI', type: 'LLM 推理网关', chain: 'Base', facilitator: 'CDP', status: '待验证地址' },
  { name: 'Bitrefill', type: '礼品卡 / 电商', chain: 'EVM+Solana', facilitator: 'Bitrefill', status: '待验证地址' },
]

export default function AiPaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Agent 支付生态</h1>
        <p className="text-sm text-gray-500 mt-1">x402 · AP2 · ACP/SPT · MPP — 协议架构、参与方、链上数据追踪</p>
      </div>

      {/* Section 1: Protocol Architecture */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-baseline gap-2 mb-1">
          <h3 className="text-lg font-semibold text-gray-900">协议架构</h3>
          <span className="text-xs text-gray-400">四层互补，非竞争关系</span>
        </div>
        <p className="text-xs text-gray-500 mb-4">AP2 已将 x402 纳为链上支付子协议（A2A x402 Extension）</p>

        <div className="space-y-2">
          {PROTOCOL_LAYERS.map((item, i) => (
            <div key={item.layer} className={`border rounded-lg px-4 py-3 ${item.color}`}>
              <div className="flex items-start gap-3">
                {/* Layer label */}
                <div className="flex-shrink-0 w-16 pt-0.5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{item.layer}</p>
                  <p className="text-[10px] text-gray-400">{item.en}</p>
                </div>

                {/* Protocol info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-bold text-gray-900`}>{item.protocol}</span>
                    <span className="text-xs text-gray-500">by {item.by}</span>
                    {item.live
                      ? <span className="flex items-center gap-1 text-[10px] text-green-600"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>已上线</span>
                      : <span className="flex items-center gap-1 text-[10px] text-amber-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>规范阶段</span>
                    }
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{item.desc}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.partners.map(p => (
                      <span key={p} className={`text-[10px] px-1.5 py-0.5 rounded ${item.badge}`}>{p}</span>
                    ))}
                  </div>
                </div>

                {/* Arrow connector except last */}
                {i < PROTOCOL_LAYERS.length - 1 && (
                  <div className="hidden md:flex flex-shrink-0 items-center self-center">
                    <span className="text-gray-300 text-xs">↓</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Participants */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">主要参与方</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PARTICIPANTS.map(group => (
            <div key={group.category} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-base ${group.color}`}>{group.icon}</span>
                <h4 className="text-sm font-semibold text-gray-800">{group.category}</h4>
              </div>
              <div className="space-y-2">
                {group.items.map(item => (
                  <div key={item.name} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900">{item.name}</p>
                      <p className="text-[11px] text-gray-500 leading-tight">{item.role}</p>
                    </div>
                    <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${item.statusColor}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Protocol Comparison */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">协议对比</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 text-gray-400 font-medium w-24">维度</th>
                <th className="text-left py-2 px-3 text-orange-600 font-semibold">x402</th>
                <th className="text-left py-2 px-3 text-blue-600 font-semibold">AP2</th>
                <th className="text-left py-2 px-3 text-purple-600 font-semibold">ACP/SPT</th>
                <th className="text-left py-2 px-3 text-gray-600 font-semibold">MPP</th>
              </tr>
            </thead>
            <tbody>
              {PROTOCOL_COMPARE.map(row => (
                <tr key={row.dim} className="border-b border-gray-50">
                  <td className="py-2 pr-4 text-gray-400 font-medium">{row.dim}</td>
                  <td className="py-2 px-3 text-gray-700">{row.x402}</td>
                  <td className="py-2 px-3 text-gray-700">{row.ap2}</td>
                  <td className="py-2 px-3 text-gray-700">{row.acp}</td>
                  <td className="py-2 px-3 text-gray-700">{row.mpp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Tracking Metrics */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-baseline gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">x402 链上追踪</h3>
          <span className="text-xs text-gray-400">监控已知服务商 payTo 地址，统计 USDC on Base 流量</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {TRACKING_METRICS.map(item => (
            <div key={item.label} className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className={`text-xl font-semibold mt-1 ${item.value === '—' ? 'text-gray-300' : item.color}`}>{item.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{item.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 5: Known x402 Providers */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-baseline gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">已知 x402 服务商</h3>
          <span className="text-xs text-gray-400">地址待验证，接入后可实时追踪支付流</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 text-gray-400 font-medium">服务商</th>
                <th className="text-left py-2 px-2 text-gray-400 font-medium">类型</th>
                <th className="text-left py-2 px-2 text-gray-400 font-medium">链</th>
                <th className="text-left py-2 px-2 text-gray-400 font-medium">Facilitator</th>
                <th className="text-left py-2 px-2 text-gray-400 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {KNOWN_PROVIDERS.map(p => (
                <tr key={p.name} className="border-b border-gray-50">
                  <td className="py-2 px-2 font-medium text-gray-700">{p.name}</td>
                  <td className="py-2 px-2 text-gray-500">{p.type}</td>
                  <td className="py-2 px-2 text-gray-500">{p.chain}</td>
                  <td className="py-2 px-2 text-gray-500">{p.facilitator}</td>
                  <td className="py-2 px-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{p.status}</span>
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
