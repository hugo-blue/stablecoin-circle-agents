'use client'

// ─── 需求侧：谁在付钱 ───────────────────────────────────────────────────────

const DEMAND_NATIVE = [
  {
    name: 'OpenClaw',
    type: '开源 AI Agent 框架',
    stars: '247,000+',
    mau: '2,700万',
    skills: '13,729',
    payStatus: 'skill 层集成',
    payNote: 'CoinFello+MetaMask skill 已上线，官方核心仍 API Key',
    statusColor: 'bg-amber-100 text-amber-700',
    trackable: true,
    source: 'github.com/openclaw/openclaw',
  },
  {
    name: 'Coinbase AgentKit',
    type: 'Agent SDK + Embedded Wallet',
    stars: '4,200+',
    mau: '—',
    skills: '—',
    payStatus: 'x402 原生',
    payNote: 'Agentic Wallets 2026年2月上线，CDP 原生支持 x402',
    statusColor: 'bg-green-100 text-green-700',
    trackable: true,
    source: 'github.com/coinbase/agentkit',
  },
  {
    name: 'Bino',
    type: '自主 AI Agent 框架',
    stars: '—',
    mau: '—',
    skills: '—',
    payStatus: 'x402 原生',
    payNote: '以消费付费服务为核心设计，x402 生态目录已收录',
    statusColor: 'bg-green-100 text-green-700',
    trackable: false,
    source: 'x402.org/ecosystem',
  },
]

const DEMAND_POTENTIAL = [
  {
    name: 'ChatGPT',
    by: 'OpenAI',
    mau: '3亿+',
    payProtocol: 'ACP / SPT',
    payStatus: 'Instant Checkout 上线',
    statusColor: 'bg-green-100 text-green-700',
    note: 'Stripe ACP，已可在 ChatGPT 内购买 Etsy/Shopify 商品',
  },
  {
    name: 'Perplexity',
    by: 'Perplexity AI',
    mau: '1,500万+',
    payProtocol: 'ACP / SPT',
    payStatus: 'ACP 合作方',
    statusColor: 'bg-blue-100 text-blue-700',
    note: 'Stripe ACP 官方合作方，购物 agent 功能开发中',
  },
  {
    name: 'Microsoft Copilot',
    by: 'Microsoft',
    mau: '数亿（Office 嵌入）',
    payProtocol: 'ACP / SPT',
    payStatus: 'ACP 合作方',
    statusColor: 'bg-blue-100 text-blue-700',
    note: 'Stripe ACP 合作，企业采购 agent 场景',
  },
  {
    name: 'Cursor / Replit / Bolt',
    by: '各自独立',
    mau: '数百万（开发者）',
    payProtocol: 'ACP / SPT',
    payStatus: 'ACP 合作方',
    statusColor: 'bg-blue-100 text-blue-700',
    note: 'Stripe ACP 合作方，开发者工具 agent 化后的支付场景',
  },
]

// ─── 服务侧：谁在收钱 ───────────────────────────────────────────────────────

const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const SOLANA_USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

const SERVICES = [
  {
    category: '网页数据',
    color: 'bg-blue-50',
    dot: 'bg-blue-400',
    items: [
      { name: 'Firecrawl', desc: '网页抓取，LLM-ready 数据', chain: 'Base', endpoint: 'api.firecrawl.dev/v1/x402/search', payTo: '待抓取', price: '—', trackStatus: 'endpoint 已知' },
      { name: 'Zyte API', desc: '企业级网页提取服务', chain: 'Base', endpoint: '—', payTo: '待抓取', price: '—', trackStatus: '待验证' },
    ],
  },
  {
    category: '社交 & 链上数据',
    color: 'bg-purple-50',
    dot: 'bg-purple-400',
    items: [
      { name: 'Neynar', desc: 'Farcaster 社交图谱，agent 友好', chain: 'Base', endpoint: '—', payTo: '待抓取', price: '—', trackStatus: '待验证' },
      { name: 'Einstein AI', desc: '链上巨鲸追踪、DEX 分析、MEV', chain: 'Base', endpoint: '—', payTo: '待抓取', price: '—', trackStatus: '待验证' },
      { name: 'WalletIQ', desc: '钱包情报 API，$0.005/次', chain: 'Base', endpoint: '—', payTo: '待抓取', price: '$0.005', trackStatus: '价格已知' },
    ],
  },
  {
    category: 'AI 推理',
    color: 'bg-orange-50',
    dot: 'bg-orange-400',
    items: [
      { name: 'BlockRun.AI', desc: 'LLM 网关，按调用计费', chain: 'Base', endpoint: '—', payTo: '待抓取', price: '—', trackStatus: '待验证' },
      { name: 'AskClaude', desc: '按问题付费，$0.01–$0.10', chain: 'Base', endpoint: '—', payTo: '待抓取', price: '$0.01–$0.10', trackStatus: '价格已知' },
      { name: 'Obol', desc: 'AI 代码生成，$5 USDC/次', chain: 'Base', endpoint: '—', payTo: '待抓取', price: '$5', trackStatus: '价格已知' },
    ],
  },
  {
    category: '存储 & 基础设施',
    color: 'bg-green-50',
    dot: 'bg-green-400',
    items: [
      { name: 'Pinata', desc: 'IPFS 上传，无需账户', chain: 'Base', endpoint: '—', payTo: '待抓取', price: '—', trackStatus: '待验证' },
      { name: 'Bitrefill', desc: '礼品卡 / 电商，免费 Facilitator', chain: 'EVM+Solana', endpoint: '—', payTo: '待抓取', price: '—', trackStatus: '待验证' },
    ],
  },
]

// ─── 协议对比 ────────────────────────────────────────────────────────────────

const PROTOCOLS = [
  { name: 'x402', by: 'Coinbase', layer: '执行层', settlement: '链上 USDC', scene: 'API / 开发者 / crypto-native', live: true, color: 'border-l-orange-400' },
  { name: 'AP2', by: 'Google', layer: '授权层', settlement: '支付无关（全轨道）', scene: '企业 agent 授权链路', live: false, color: 'border-l-blue-400' },
  { name: 'ACP / SPT', by: 'Stripe + OpenAI', layer: '商务层', settlement: '法币优先', scene: '消费者 agent 购物', live: true, color: 'border-l-purple-400' },
  { name: 'MPP', by: 'Tempo (Stripe+Paradigm)', layer: '基础链', settlement: '法币 + 链上双轨', scene: '高频 M2M 微支付', live: true, color: 'border-l-gray-400' },
]

// ─── 基础设施 ────────────────────────────────────────────────────────────────

const FACILITATORS = [
  { name: 'CDP Facilitator', by: 'Coinbase', networks: 'Base / Polygon / Solana', features: 'KYT/OFAC 合规，默认推荐', endpoint: 'api.cdp.coinbase.com/platform/v2/x402', free: true },
  { name: 'PayAI', by: 'PayAI', networks: 'Base / Solana / Avalanche', features: '多链，production-ready', endpoint: '—', free: false },
  { name: 'Primer', by: 'Primer', networks: 'Base / EVM', features: 'V1 & V2，全 ERC-20 支持', endpoint: '—', free: false },
  { name: 'OpenFacilitator', by: 'Community', networks: 'Base', features: '开源，免费，可自托管', endpoint: '—', free: true },
  { name: 'Mogami', by: 'Mogami', networks: 'Base / EVM', features: '开发者友好，Java SDK', endpoint: '—', free: true },
]

const CONTRACT_ADDRS = [
  { net: 'Base 主网', token: 'USDC', addr: BASE_USDC, scan: `https://basescan.org/token/${BASE_USDC}` },
  { net: 'Solana', token: 'USDC', addr: SOLANA_USDC, scan: `https://solscan.io/token/${SOLANA_USDC}` },
  { net: 'Base Sepolia', token: 'USDC (测试)', addr: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', scan: 'https://sepolia.basescan.org' },
]

// ─── 最新进展（预留） ──────────────────────────────────────────────────────────

const NEWS_PLACEHOLDER = [
  { date: '2026-03-18', title: 'Tempo (Stripe+Paradigm) 主网上线，MPP 协议正式发布', tags: ['MPP', 'Stripe', '主网'], source: 'Fortune' },
  { date: '2026-03-11', title: 'Ramp 推出 Agent Cards，企业 AI agent 可申请虚拟 Visa 卡', tags: ['动态预算', 'Web2', 'Ramp'], source: 'StableDash' },
  { date: '2026-02-14', title: 'OpenClaw 创始人加入 OpenAI，项目移交开源基金会', tags: ['OpenClaw', '基金会'], source: 'Medium' },
  { date: '2026-01-xx', title: 'Google 发布 AP2 协议，60+ 机构联合背书', tags: ['AP2', 'Google', '标准'], source: 'Google Cloud Blog' },
]

// ─── Page ────────────────────────────────────────────────────────────────────

function SectionHeader({ title, sub, badge }: { title: string; sub: string; badge?: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {badge && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">{badge}</span>
      )}
      <span className="text-xs text-gray-400">{sub}</span>
    </div>
  )
}

function TrackDot({ status }: { status: string }) {
  const live = status.includes('已知') || status.includes('原生') || status.includes('上线')
  const pending = status.includes('待')
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
      live ? 'bg-green-100 text-green-700' : pending ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
    }`}>
      <span className={`w-1 h-1 rounded-full ${live ? 'bg-green-500' : pending ? 'bg-amber-400' : 'bg-gray-400'}`} />
      {status}
    </span>
  )
}

export default function AiPaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Agent 支付生态</h1>
        <p className="text-sm text-gray-500 mt-1">需求侧 · 服务侧 · 协议对比 · 基础设施 — 动态追踪视角</p>
      </div>

      {/* ── 1. 需求侧 ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <SectionHeader title="需求侧" sub="谁在付钱 · 规模与支付就绪度" badge="可追踪" />

        {/* x402 native agents */}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">x402 原生 / 链上支付就绪</p>
        <div className="space-y-2 mb-5">
          {DEMAND_NATIVE.map(a => (
            <div key={a.name} className="bg-gray-50 rounded-lg px-4 py-3 flex gap-4 items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">{a.name}</span>
                  <span className="text-xs text-gray-400">{a.type}</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">{a.payNote}</p>
              </div>
              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                <TrackDot status={a.payStatus} />
                <div className="flex gap-2 text-[10px] text-gray-400">
                  {a.stars !== '—' && <span>⭐ {a.stars}</span>}
                  {a.mau !== '—' && <span>MAU {a.mau}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* potential demand */}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">主流 AI 产品 — 支付就绪度追踪</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 text-gray-400 font-medium">产品</th>
                <th className="text-left py-2 px-3 text-gray-400 font-medium">MAU</th>
                <th className="text-left py-2 px-3 text-gray-400 font-medium">支付协议</th>
                <th className="text-left py-2 px-3 text-gray-400 font-medium">状态</th>
                <th className="text-left py-2 px-3 text-gray-400 font-medium">说明</th>
              </tr>
            </thead>
            <tbody>
              {DEMAND_POTENTIAL.map(d => (
                <tr key={d.name} className="border-b border-gray-50">
                  <td className="py-2 pr-4">
                    <p className="font-medium text-gray-800">{d.name}</p>
                    <p className="text-gray-400">{d.by}</p>
                  </td>
                  <td className="py-2 px-3 text-gray-600">{d.mau}</td>
                  <td className="py-2 px-3 font-medium text-gray-700">{d.payProtocol}</td>
                  <td className="py-2 px-3">
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${d.statusColor}`}>{d.payStatus}</span>
                  </td>
                  <td className="py-2 px-3 text-gray-400 max-w-[220px]">{d.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 2. 服务侧 ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <SectionHeader title="服务侧" sub="谁在收钱 · payTo 地址追踪 → 链上可验证" badge="链上可追踪" />

        {/* USDC settlement info bar */}
        <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 bg-orange-50 rounded-lg px-4 py-2.5 text-xs">
          <span className="text-gray-500 font-medium">结算资产</span>
          <span className="text-gray-600">Base 主网 USDC
            <a href={`https://basescan.org/token/${BASE_USDC}`} target="_blank" rel="noopener noreferrer"
              className="ml-1.5 font-mono text-blue-600 hover:underline">{BASE_USDC.slice(0,6)}…{BASE_USDC.slice(-4)}</a>
          </span>
          <span className="text-gray-600">Solana USDC
            <a href={`https://solscan.io/token/${SOLANA_USDC}`} target="_blank" rel="noopener noreferrer"
              className="ml-1.5 font-mono text-blue-600 hover:underline">{SOLANA_USDC.slice(0,6)}…{SOLANA_USDC.slice(-4)}</a>
          </span>
          <span className="text-orange-600 font-medium">↗ payTo 地址从 402 响应头抓取后可直接 Basescan 追踪</span>
        </div>

        <div className="space-y-4">
          {SERVICES.map(group => (
            <div key={group.category}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${group.dot}`} />
                <p className="text-xs font-semibold text-gray-600">{group.category}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-1.5 pr-3 text-gray-400 font-medium">服务商</th>
                      <th className="text-left py-1.5 px-3 text-gray-400 font-medium">链</th>
                      <th className="text-left py-1.5 px-3 text-gray-400 font-medium">单价</th>
                      <th className="text-left py-1.5 px-3 text-gray-400 font-medium">x402 端点</th>
                      <th className="text-left py-1.5 px-3 text-gray-400 font-medium">payTo</th>
                      <th className="text-left py-1.5 px-3 text-gray-400 font-medium">追踪状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map(s => (
                      <tr key={s.name} className="border-b border-gray-50">
                        <td className="py-1.5 pr-3">
                          <p className="font-medium text-gray-800">{s.name}</p>
                          <p className="text-gray-400 text-[10px]">{s.desc}</p>
                        </td>
                        <td className="py-1.5 px-3 text-gray-500">{s.chain}</td>
                        <td className="py-1.5 px-3 font-medium text-gray-700">{s.price}</td>
                        <td className="py-1.5 px-3 font-mono text-[10px] text-gray-400">{s.endpoint === '—' ? '—' : s.endpoint}</td>
                        <td className="py-1.5 px-3 font-mono text-[10px] text-gray-300">{s.payTo}</td>
                        <td className="py-1.5 px-3"><TrackDot status={s.trackStatus} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[11px] text-gray-400">
          * payTo 地址需对各服务商端点发起 HTTP 请求，从 402 响应头 <code className="bg-gray-100 px-1 rounded">X-Payment-Requirements</code> 中提取。地址确认后可在 Basescan 上追踪该地址的 USDC 收款记录。
        </p>
      </div>

      {/* ── 3. 协议对比 ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <SectionHeader title="协议对比" sub="四层互补，AP2 已将 x402 纳为链上子协议" />
        <div className="space-y-2">
          {PROTOCOLS.map(p => (
            <div key={p.name} className={`border-l-4 ${p.color} bg-gray-50 rounded-r-lg px-4 py-2.5 flex gap-4 items-center`}>
              <div className="w-24 flex-shrink-0">
                <p className="text-sm font-bold text-gray-900">{p.name}</p>
                <p className="text-[10px] text-gray-400">{p.by}</p>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                <div><span className="text-gray-400">层级</span><p className="text-gray-700 font-medium">{p.layer}</p></div>
                <div><span className="text-gray-400">结算</span><p className="text-gray-700">{p.settlement}</p></div>
                <div><span className="text-gray-400">核心场景</span><p className="text-gray-700">{p.scene}</p></div>
              </div>
              <div className="flex-shrink-0">
                {p.live
                  ? <span className="flex items-center gap-1 text-[10px] text-green-600"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />已上线</span>
                  : <span className="flex items-center gap-1 text-[10px] text-amber-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />规范阶段</span>
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. 基础设施 ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <SectionHeader title="基础设施" sub="Facilitator · 链 · 合约地址" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Facilitators */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Facilitator（结算验证方）</p>
            <div className="space-y-1.5">
              {FACILITATORS.map(f => (
                <div key={f.name} className="flex items-start justify-between gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800">{f.name}
                      {f.free && <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-green-100 text-green-700">免费</span>}
                    </p>
                    <p className="text-[10px] text-gray-400">{f.networks} · {f.features}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contract addresses */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">合约地址参考</p>
            <div className="space-y-1.5">
              {CONTRACT_ADDRS.map(c => (
                <div key={c.net} className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{c.net} · {c.token}</span>
                    <a href={c.scan} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-blue-500 hover:underline">Scan ↗</a>
                  </div>
                  <p className="font-mono text-[10px] text-gray-600 mt-0.5 break-all">{c.addr}</p>
                </div>
              ))}
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-500">CDP Facilitator 端点</span>
                <p className="font-mono text-[10px] text-gray-600 mt-0.5 break-all">api.cdp.coinbase.com/platform/v2/x402</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. 最新进展 ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-baseline gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">最新进展</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">数据接入中</span>
          <span className="text-xs text-gray-400">协议发布 · 生态动态 · 机构采用</span>
        </div>

        <div className="space-y-2">
          {NEWS_PLACEHOLDER.map((n, i) => (
            <div key={i} className="flex gap-3 items-start border-b border-gray-50 pb-2">
              <span className="text-[10px] text-gray-400 font-mono flex-shrink-0 pt-0.5 w-20">{n.date}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">{n.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {n.tags.map(t => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{t}</span>
                  ))}
                  <span className="text-[10px] text-gray-400">via {n.source}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-gray-400">
          后续将接入 RSS / API 自动抓取，实时追踪 x402、AP2、ACP、OpenClaw 等生态动态。
        </p>
      </div>
    </div>
  )
}
