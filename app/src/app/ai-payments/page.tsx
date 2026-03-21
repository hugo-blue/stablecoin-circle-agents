'use client'

import { useState, useEffect } from 'react'
import type { Provider } from '@/app/api/ai-payments/providers/route'

// ─── 协议对比（静态）────────────────────────────────────────────────────────────

const PROTOCOLS = [
  { name: 'x402', by: 'Coinbase', layer: '执行层', settlement: '链上 USDC', scene: 'API / 开发者 / crypto-native', live: true, color: 'border-l-orange-400' },
  { name: 'AP2', by: 'Google', layer: '授权层', settlement: '支付无关（全轨道）', scene: '企业 agent 授权链路', live: false, color: 'border-l-blue-400' },
  { name: 'ACP / SPT', by: 'Stripe + OpenAI', layer: '商务层', settlement: '法币（信用卡 / Stripe Link）', scene: '消费者 agent 购物', live: true, color: 'border-l-purple-400' },
  { name: 'MPP', by: 'Tempo (Stripe+Paradigm)', layer: '基础链', settlement: '法币 + 链上双轨', scene: '高频 M2M 微支付', live: true, color: 'border-l-gray-400' },
]

// ─── 基础设施（静态）────────────────────────────────────────────────────────────

const FACILITATORS = [
  { name: 'CDP Facilitator', by: 'Coinbase', networks: 'Base / Polygon / Solana', features: 'KYT/OFAC 合规，默认推荐', free: true },
  { name: 'PayAI', by: 'PayAI', networks: 'Base / Solana / Avalanche', features: '多链，production-ready', free: false },
  { name: 'Primer', by: 'Primer', networks: 'Base / EVM', features: 'V1 & V2，全 ERC-20 支持', free: false },
  { name: 'OpenFacilitator', by: 'Community', networks: 'Base', features: '开源，免费，可自托管', free: true },
  { name: 'Mogami', by: 'Mogami', networks: 'Base / EVM', features: '开发者友好，Java SDK', free: true },
]

const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const SOLANA_USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

const CONTRACT_ADDRS = [
  { net: 'Base 主网', token: 'USDC', addr: BASE_USDC, scan: `https://basescan.org/token/${BASE_USDC}` },
  { net: 'Solana', token: 'USDC', addr: SOLANA_USDC, scan: `https://solscan.io/token/${SOLANA_USDC}` },
  { net: 'Base Sepolia', token: 'USDC (测试)', addr: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', scan: 'https://sepolia.basescan.org' },
]

// ─── 最新进展（静态预留）────────────────────────────────────────────────────────

const NEWS_PLACEHOLDER = [
  { date: '2026-03-18', title: 'Tempo (Stripe+Paradigm) 主网上线，MPP 协议正式发布', tags: ['MPP', 'Stripe', '主网'], source: 'Fortune' },
  { date: '2026-03-11', title: 'Ramp 推出 Agent Cards，企业 AI agent 可申请虚拟 Visa 卡', tags: ['动态预算', 'Web2', 'Ramp'], source: 'StableDash' },
  { date: '2026-02-14', title: 'OpenClaw 创始人加入 OpenAI，项目移交开源基金会', tags: ['OpenClaw', '基金会'], source: 'Medium' },
  { date: '2026-01-xx', title: 'Google 发布 AP2 协议，60+ 机构联合背书', tags: ['AP2', 'Google', '标准'], source: 'Google Cloud Blog' },
]

// ─── 辅助 ────────────────────────────────────────────────────────────────────

const CATEGORY_STYLE: Record<string, { dot: string }> = {
  '网页数据':  { dot: 'bg-blue-400' },
  '社交数据':  { dot: 'bg-purple-400' },
  '链上数据':  { dot: 'bg-purple-400' },
  'AI推理':   { dot: 'bg-orange-400' },
  '存储':     { dot: 'bg-green-400' },
  '电商':     { dot: 'bg-green-400' },
}

const PROVIDER_DESC: Record<string, string> = {
  'Firecrawl':   '网页抓取，LLM-ready 数据',
  'Zyte API':    '企业级网页提取服务',
  'Neynar':      'Farcaster 社交图谱，agent 友好',
  'Einstein AI': '链上巨鲸追踪、DEX 分析、MEV',
  'WalletIQ':    '钱包情报 API',
  'BlockRun.AI': 'LLM 网关，按调用计费',
  'AskClaude':   '按问题付费',
  'Obol':        'AI 代码生成',
  'Pinata':      'IPFS 上传，无需账户',
  'Bitrefill':   '礼品卡 / 电商，免费 Facilitator',
}

const TRACK_STATUS_LABEL: Record<string, string> = {
  verified:       '已验证',
  endpoint_known: 'endpoint 已知',
  probe_blocked:  '探针被拦截',
  pending:        '待验证',
  not_x402:       '非 x402',
}

type ProviderGroup = { category: string; items: Provider[] }

function groupByCategory(providers: Provider[]): ProviderGroup[] {
  const map = new Map<string, Provider[]>()
  for (const p of providers) {
    const list = map.get(p.category) ?? []
    list.push(p)
    map.set(p.category, list)
  }
  return Array.from(map.entries()).map(([category, items]) => ({ category, items }))
}

function formatPrice(p: Provider): string {
  if (p.priceUsdc === null) return '—'
  return `$${p.priceUsdc}`
}

function fmt(n: number | null | undefined): string {
  if (n == null) return '—'
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n)
}

function fmtGrowth(pct: number | null | undefined): string {
  if (pct == null) return ''
  return pct >= 0 ? `+${pct}%` : `${pct}%`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, sub, badge }: { title: string; sub: string; badge?: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {badge && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">{badge}</span>}
      <span className="text-xs text-gray-400">{sub}</span>
    </div>
  )
}

function TrackDot({ status }: { status: string }) {
  const live = status.includes('已知') || status.includes('原生') || status.includes('上线') || status.includes('已验证')
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

// ─── Demand Stats (live) ──────────────────────────────────────────────────────

type DemandData = {
  openclaw: { stars: number | null }
  agentkit: { stars: number | null; npmWeekly: number | null; npmMonthly: number | null; npmGrowthPct: number | null }
  x402: { stars: number | null; npmWeekly: number | null; npmMonthly: number | null; npmGrowthPct: number | null; coinbaseX402Weekly: number | null; coinbaseX402Monthly: number | null }
  clawHub: { totalSkills: number; x402Skills: string[] }
}

function DemandSection() {
  const [data, setData] = useState<DemandData | null>(null)
  const [state, setState] = useState<'loading' | 'success' | 'partial' | 'error'>('loading')

  useEffect(() => {
    fetch('/api/ai-payments/demand-stats')
      .then(r => r.json())
      .then(body => { setData(body.data); setState(body.state) })
      .catch(() => setState('error'))
  }, [])

  const loading = state === 'loading'

  return (
    <div className="space-y-5">
      {/* x402 开发者生态 */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">x402 开发者生态 — live</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="coinbase/x402 Stars"
            value={loading ? null : fmt(data?.x402.stars)}
            sub="GitHub"
            loading={loading}
            href="https://github.com/coinbase/x402"
          />
          <StatCard
            label="x402 npm 周/月下载"
            value={loading ? null : fmt(data?.x402.npmWeekly)}
            sub={loading ? 'npmjs.com' : `月 ${fmt(data?.x402.npmMonthly)}`}
            growth={loading ? null : data?.x402.npmGrowthPct ?? null}
            loading={loading}
            href="https://www.npmjs.com/package/x402"
          />
          <StatCard
            label="@coinbase/x402 周/月"
            value={loading ? null : fmt(data?.x402.coinbaseX402Weekly)}
            sub={loading ? 'npmjs.com' : `月 ${fmt(data?.x402.coinbaseX402Monthly)}`}
            loading={loading}
            href="https://www.npmjs.com/package/@coinbase/x402"
          />
          <StatCard
            label="AgentKit 周/月下载"
            value={loading ? null : fmt(data?.agentkit.npmWeekly)}
            sub={loading ? 'npmjs.com' : `月 ${fmt(data?.agentkit.npmMonthly)}`}
            growth={loading ? null : data?.agentkit.npmGrowthPct ?? null}
            loading={loading}
            href="https://www.npmjs.com/package/@coinbase/agentkit"
          />
        </div>
      </div>

      {/* OpenClaw + ClawHub */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">OpenClaw 生态 — live</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard
            label="OpenClaw GitHub Stars"
            value={loading ? null : fmt(data?.openclaw.stars)}
            sub="全球最多 star 开源仓库"
            loading={loading}
            href="https://github.com/openclaw/openclaw"
          />
          <StatCard
            label="ClawHub 总 Skills"
            value={loading ? null : data ? `${data.clawHub.totalSkills.toLocaleString()}+` : '—'}
            sub="clawhub.ai 官方注册表"
            loading={loading}
            href="https://clawhub.ai"
          />
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] text-gray-400 mb-1">x402 接入 Skills（已验证）</p>
            {loading
              ? <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
              : (
                <div className="flex flex-wrap gap-1 mt-1">
                  {data?.clawHub.x402Skills.map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">{s}</span>
                  ))}
                </div>
              )
            }
            <p className="text-[10px] text-gray-400 mt-1.5">Messari: 链上数据按调用付费 · Breeze: 收益聚合器</p>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          增长率 = 最近一周 vs 前三周均值。x402 skills 总数追踪中（需 ClawHub 开放 API）。
        </p>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, loading, href, growth }: {
  label: string; value: string | null; sub: string; loading: boolean; href?: string; growth?: number | null
}) {
  const growthColor = growth == null ? '' : growth >= 0 ? 'text-green-600' : 'text-red-500'
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-[10px] text-gray-400 mb-1">{label}</p>
      {loading
        ? <div className="h-6 bg-gray-200 rounded animate-pulse w-16 mb-1" />
        : (
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-black">{value ?? '—'}</p>
            {growth != null && (
              <span className={`text-[11px] font-semibold ${growthColor}`}>{fmtGrowth(growth)} WoW</span>
            )}
          </div>
        )
      }
      {href
        ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline">{sub}</a>
        : <p className="text-[10px] text-gray-400">{sub}</p>
      }
    </div>
  )
}

// ─── Providers Section ────────────────────────────────────────────────────────

function ProvidersSection() {
  const [groups, setGroups] = useState<ProviderGroup[]>([])
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    fetch('/api/ai-payments/providers')
      .then(r => r.json())
      .then(body => { setGroups(groupByCategory(body.data ?? [])); setState(body.state) })
      .catch(() => setState('error'))
  }, [])

  if (state === 'loading') {
    return <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded animate-pulse" />)}</div>
  }
  if (state === 'error') {
    return <p className="text-xs text-red-400">加载服务商数据失败</p>
  }

  return (
    <div className="space-y-4">
      {groups.map(group => {
        const style = CATEGORY_STYLE[group.category] ?? { dot: 'bg-gray-400' }
        return (
          <div key={group.category}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${style.dot}`} />
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
                        <p className="text-gray-400 text-[10px]">{PROVIDER_DESC[s.name] ?? ''}</p>
                      </td>
                      <td className="py-1.5 px-3 text-gray-500">{s.chain}</td>
                      <td className="py-1.5 px-3 font-medium text-gray-700">{formatPrice(s)}</td>
                      <td className="py-1.5 px-3 font-mono text-[10px] text-gray-400">{s.endpoint ?? '—'}</td>
                      <td className="py-1.5 px-3 font-mono text-[10px] text-gray-300">
                        {s.payToAddress
                          ? `${s.payToAddress.slice(0, 6)}…${s.payToAddress.slice(-4)}`
                          : '待抓取'}
                      </td>
                      <td className="py-1.5 px-3">
                        <TrackDot status={TRACK_STATUS_LABEL[s.trackStatus] ?? s.trackStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AiPaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Agent 支付生态</h1>
        <p className="text-sm text-gray-500 mt-1">需求侧 · 服务侧 · 协议对比 · 基础设施 — 动态追踪视角</p>
      </div>

      {/* ── 1. 需求侧 ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <SectionHeader title="需求侧" sub="x402 开发者生态 · OpenClaw · ClawHub" badge="Live API" />
        <DemandSection />
      </div>

      {/* ── 2. 服务侧 ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <SectionHeader title="服务侧" sub="谁在收钱 · payTo 地址追踪 → 链上可验证" badge="链上可追踪" />

        <div className="mb-4 bg-blue-50 rounded-lg px-4 py-3 text-xs text-gray-600 leading-relaxed">
          <span className="font-semibold text-gray-800">payTo 地址是什么？</span>
          {' '}服务商在 Base / Solana 链上的<strong>收款钱包地址</strong>（如 <code className="bg-white px-1 rounded text-[10px]">0xABC...123</code>），包含在 HTTP 402 响应头 <code className="bg-white px-1 rounded text-[10px]">X-Payment-Requirements</code> 中。
          每次 agent 付款 = 一笔 USDC Transfer 到该地址，在 Basescan 上永久可查。
          <span className="ml-1 text-blue-600 font-medium">追踪路径：探针 endpoint → 从 402 响应头提取 payTo → Basescan 查该地址收款记录。</span>
        </div>

        <ProvidersSection />

        <div className="mt-3 bg-amber-50 rounded-lg px-4 py-2.5 text-[11px] text-amber-700">
          <span className="font-semibold">隐私结构性限制：</span> payTo 地址理论上可通过探针从 402 响应头抓取，但公司不会主动公告——地址公开即意味着链上收入透明。Firecrawl / Messari 等已探针 endpoint，地址确认后可在 Basescan 追踪 USDC 收款记录。
        </div>
      </div>

      {/* ── 3. 协议对比 ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <SectionHeader title="协议对比" sub="四层互补，AP2 已将 x402 纳为链上子协议" />
        <div className="space-y-2">
          {PROTOCOLS.map(p => (
            <div key={p.name} className={`border-l-4 ${p.color} bg-gray-50 rounded-r-lg px-4 py-2.5 flex gap-4 items-center`}>
              <div className="w-28 flex-shrink-0">
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

        {/* ACP 说明 */}
        <div className="mt-4 bg-purple-50 rounded-lg px-4 py-3 text-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-1.5 py-0.5 rounded bg-purple-200 text-purple-700 text-[10px] font-medium">法币轨道</span>
            <span className="font-semibold text-gray-700">ACP / Instant Checkout 用户流程</span>
          </div>
          <p className="text-gray-500 leading-relaxed">
            用户在 ChatGPT 表达购买意图 → agent 向商家 ACP 端点请求购物车 → Stripe 嵌入式 UI 弹出（卡号输入给 Stripe，<strong>不传给 ChatGPT</strong>）→ Stripe 生成单次限额 SPT（Shared Payment Token）→ agent 用 SPT 完成结账。老用户通过 Stripe Link 存储的卡可一键完成。<span className="text-purple-600 font-medium">底层是信用卡 / Apple Pay，非稳定币。</span>
          </p>
          <p className="text-gray-400 mt-1">ChatGPT / Perplexity / Copilot / Cursor 等均走此轨道，代表法币 agent 商务规模，与 x402 USDC 轨道平行发展。</p>
        </div>
      </div>

      {/* ── 4. 基础设施 ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <SectionHeader title="基础设施" sub="Facilitator · 链 · 合约地址" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="mt-2 bg-gray-100 rounded-lg px-3 py-2 text-[11px] text-gray-500">
              <span className="font-medium">链上追踪：</span>Facilitator 不持有资金，USDC 直接转入 payTo 地址。链上追踪 Facilitator 需确认其提交钱包地址（msg.sender），CDP Facilitator 提交地址未公开，待从已知 x402 交易中反向提取。
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">USDC 代币合约（结算资产，非 payTo）</p>
            <div className="space-y-1.5">
              {CONTRACT_ADDRS.map(c => (
                <div key={c.net} className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{c.net} · {c.token}</span>
                    <a href={c.scan} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline">Scan ↗</a>
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
