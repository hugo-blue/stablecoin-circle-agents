'use client'

import { useState, useEffect } from 'react'
import type { Provider } from '@/app/api/ai-payments/providers/route'
import type { WeeklyDownload } from '@/app/api/ai-payments/demand-history/route'

// ─── 协议全景（静态）────────────────────────────────────────────────────────────

const PROTOCOLS = [
  {
    name: 'x402',
    by: 'Coinbase',
    track: '稳定币轨道',
    trackColor: 'bg-orange-100 text-orange-700',
    layer: '执行层',
    settlement: 'Base 链 USDC（链上不可逆）',
    scene: 'M2M 微支付 · API 按调用计费 · < $0.01',
    live: true,
    color: 'border-l-orange-400',
  },
  {
    name: 'ACP / SPT',
    by: 'Stripe + OpenAI',
    track: '法币轨道',
    trackColor: 'bg-purple-100 text-purple-700',
    layer: '商务层',
    settlement: '法币（信用卡 / Apple Pay）',
    scene: '消费者 agent 购物 · 对话式电商 · 退款可撤销',
    live: true,
    color: 'border-l-purple-400',
  },
  {
    name: 'AP2',
    by: 'Google',
    track: '兼容层',
    trackColor: 'bg-blue-100 text-blue-700',
    layer: '授权层',
    settlement: '支付无关（兼容 x402 / ACP 双轨）',
    scene: '企业级 agent 授权链路 · 60+ 机构背书',
    live: false,
    color: 'border-l-blue-400',
  },
  {
    name: 'MPP',
    by: 'Tempo (Stripe+Paradigm)',
    track: '双轨',
    trackColor: 'bg-gray-100 text-gray-600',
    layer: '基础链',
    settlement: '法币 + 链上双轨',
    scene: '高频 M2M 微支付 · 2026.3 主网上线',
    live: true,
    color: 'border-l-gray-400',
  },
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

const NEWS_PLACEHOLDER = [
  { date: '2026-03-18', title: 'Tempo (Stripe+Paradigm) 主网上线，MPP 协议正式发布', tags: ['MPP', 'Stripe', '主网'], source: 'Fortune' },
  { date: '2026-03-11', title: 'Ramp 推出 Agent Cards，企业 AI agent 可申请虚拟 Visa 卡', tags: ['动态预算', 'Web2', 'Ramp'], source: 'StableDash' },
  { date: '2026-02-14', title: 'OpenClaw 创始人加入 OpenAI，项目移交开源基金会', tags: ['OpenClaw', '基金会'], source: 'Medium' },
  { date: '2026-01-xx', title: 'Google 发布 AP2 协议，60+ 机构联合背书', tags: ['AP2', 'Google', '标准'], source: 'Google Cloud Blog' },
]

// ─── 辅助 ────────────────────────────────────────────────────────────────────

const CATEGORY_STYLE: Record<string, { dot: string }> = {
  'AI Agent生态': { dot: 'bg-yellow-400' },
  'DeFi交易':    { dot: 'bg-red-400' },
  '网页数据':    { dot: 'bg-blue-400' },
  '社交数据':    { dot: 'bg-purple-400' },
  '链上数据':    { dot: 'bg-purple-400' },
  'AI推理':      { dot: 'bg-orange-400' },
  '存储':        { dot: 'bg-green-400' },
  '电商':        { dot: 'bg-green-400' },
}

const PROVIDER_DESC: Record<string, string> = {
  'Virtuals Protocol': 'x402scan #1 · 日均 5万+ 笔 · ACP-x402 已融合上线',
  'SniperX':     'x402scan #3 · 专业交易 Bot · 高频链上套利',
  'Firecrawl':   '网页抓取，LLM-ready 数据',
  'Zyte API':    '企业级网页提取服务',
  'Nansen':      'x402scan #10 · 链上分析，传统 SaaS 接入 x402 验证',
  'Neynar':      'Farcaster 社交图谱，agent 友好',
  'Einstein AI': '链上巨鲸追踪、DEX 分析、MEV',
  'WalletIQ':    '钱包情报 API',
  'BlockRun.AI': 'x402scan #5 · 日均 2.8K 笔 · 链上监控 / LLM 网关',
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

// MoM growth from 8 weekly data points: last 4 weeks vs previous 4 weeks
function calcMoM(weekly: WeeklyDownload[]): number | null {
  if (weekly.length < 8) return null
  const last4 = weekly.slice(-4).reduce((s, w) => s + w.downloads, 0)
  const prev4 = weekly.slice(-8, -4).reduce((s, w) => s + w.downloads, 0)
  if (prev4 === 0) return null
  return Math.round(((last4 - prev4) / prev4) * 100)
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data }: { data: WeeklyDownload[] }) {
  if (data.length < 2) return <span className="text-gray-300 text-[10px]">—</span>
  const values = data.map(d => d.downloads)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const W = 72, H = 22
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W
    const y = H - ((v - min) / range) * (H - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const rising = values[values.length - 1] >= values[0]
  return (
    <svg width={W} height={H} className="inline-block opacity-80">
      <polyline
        points={pts}
        fill="none"
        stroke={rising ? '#22c55e' : '#ef4444'}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
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

// ─── Demand Stats (live) ──────────────────────────────────────────────────────

type DemandData = {
  openclaw: { stars: number | null }
  agentkit: { stars: number | null; npmWeekly: number | null; npmMonthly: number | null; npmGrowthPct: number | null }
  x402: { stars: number | null; npmWeekly: number | null; npmMonthly: number | null; npmGrowthPct: number | null; coinbaseX402Weekly: number | null; coinbaseX402Monthly: number | null }
  clawHub: { totalSkills: number; x402Skills: string[] }
}

type HistoryData = { x402: WeeklyDownload[]; coinbaseX402: WeeklyDownload[]; agentkit: WeeklyDownload[] }

function DemandSection() {
  const [data, setData] = useState<DemandData | null>(null)
  const [state, setState] = useState<'loading' | 'success' | 'partial' | 'error'>('loading')
  const [history, setHistory] = useState<HistoryData | null>(null)

  useEffect(() => {
    fetch('/api/ai-payments/demand-stats')
      .then(r => r.json())
      .then(body => { setData(body.data); setState(body.state) })
      .catch(() => setState('error'))

    fetch('/api/ai-payments/demand-history')
      .then(r => r.json())
      .then(body => { if (body.state !== 'error') setHistory(body.data) })
      .catch(() => {})
  }, [])

  const loading = state === 'loading'

  return (
    <div className="space-y-6">

      {/* ── AI Agent 生态（双向参与方） ─────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">AI Agent 生态 — 买卖双向参与</p>
        <p className="text-[11px] text-gray-400 mb-3">
          同一个 Agent 既是<strong>买家</strong>（调用外部 x402 API）也是<strong>卖家</strong>（把自己的 Skill 封装为 x402 服务出售）。
          Agent 持有链上钱包，自主支付 + 自主收款，90% 归 Seller，10% 进 ACP Treasury。
        </p>

        {/* OpenClaw 生态 */}
        <div className="border border-gray-100 rounded-xl p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <p className="text-xs font-semibold text-gray-700">OpenClaw 生态（开放框架）</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">主流</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard
              label="OpenClaw GitHub Stars"
              value={loading ? null : fmt(data?.openclaw.stars)}
              sub="openclaw/openclaw"
              loading={loading}
              href="https://github.com/openclaw/openclaw"
            />
            <StatCard
              label="ClawHub 注册 Skills"
              value={loading ? null : data ? `${data.clawHub.totalSkills.toLocaleString()}+` : '—'}
              sub="clawhub.ai"
              loading={loading}
              href="https://clawhub.ai"
            />
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[10px] text-gray-400 mb-1">x402 接入 Skills（人工验证）</p>
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
              <p className="text-[10px] text-gray-400 mt-1.5">x402 skill 总数追踪中（待 ClawHub 开放搜索 API）</p>
            </div>
          </div>
        </div>

        {/* Virtuals Protocol */}
        <div className="border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <p className="text-xs font-semibold text-gray-700">Virtuals Protocol（链上 Agent 经济层）</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-700">已集成 OpenClaw · 2026.02</span>
          </div>
          <div className="text-[11px] text-gray-500 leading-relaxed mb-2">
            Virtuals 的 <strong>ACP（Agent Commerce Protocol，自研）</strong> 是 Agent 间自主雇佣协议：
            Request → Negotiation → Transaction（escrow）→ Evaluation（智能合约 4 阶段）。
            选择 x402 作为支付执行层（<code className="bg-gray-100 px-1 rounded">acp-x402.virtuals.io</code>），
            每次 agent 雇佣任务 → x402 微支付 → Base 链 USDC 结算。
            <strong className="text-gray-700">注：这是 Virtuals 自研 ACP，与 Stripe/OpenAI 的 ACP 同名但完全不同。</strong>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-[10px] text-gray-400">x402scan 24h 笔数</p>
              <p className="text-lg font-bold text-black">50.4K</p>
              <p className="text-[10px] text-gray-400">3.3K Agent buyers</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-[10px] text-gray-400">Agentic GDP</p>
              <p className="text-lg font-bold text-black">$470M+</p>
              <p className="text-[10px] text-gray-400">快照 2026-03-21</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-[10px] text-gray-400">已部署 Agent</p>
              <p className="text-lg font-bold text-black">18K+</p>
              <p className="text-[10px] text-gray-400">OpenClaw 集成后可无缝接入</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 协议开发者生态（供给侧代理指标） ──────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">协议开发者生态 — 供给侧代理指标</p>
        <p className="text-[11px] text-gray-400 mb-3">
          npm 下载量 = 构建 x402 服务端的开发者数量，是供给侧采用率的代理指标，不直接反映 agent 数量
        </p>

        {/* GitHub Stars 行 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          <StatCard
            label="coinbase/x402 GitHub Stars"
            value={loading ? null : fmt(data?.x402.stars)}
            sub="x402 协议官方仓库"
            loading={loading}
            href="https://github.com/coinbase/x402"
          />
          <StatCard
            label="coinbase/agentkit GitHub Stars"
            value={loading ? null : fmt(data?.agentkit.stars)}
            sub="Agent 构建 SDK 仓库"
            loading={loading}
            href="https://github.com/coinbase/agentkit"
          />
          <StatCard
            label="openclaw/openclaw GitHub Stars"
            value={loading ? null : fmt(data?.openclaw.stars)}
            sub="Agent 运行时框架"
            loading={loading}
            href="https://github.com/openclaw/openclaw"
          />
        </div>

        {/* npm 趋势行（带 sparkline + WoW + MoM） */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          {/* x402 npm */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] text-gray-400 mb-1">x402 npm 周下载</p>
            {loading
              ? <div className="h-6 bg-gray-200 rounded animate-pulse w-16 mb-2" />
              : (
                <div className="flex items-baseline gap-2 mb-1">
                  <p className="text-xl font-bold text-black">{fmt(data?.x402.npmWeekly)}</p>
                  {data?.x402.npmGrowthPct != null && (
                    <span className={`text-[11px] font-semibold ${(data.x402.npmGrowthPct ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {fmtGrowth(data.x402.npmGrowthPct)} WoW
                    </span>
                  )}
                  {history && calcMoM(history.x402) != null && (
                    <span className={`text-[11px] ${(calcMoM(history.x402) ?? 0) >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                      {fmtGrowth(calcMoM(history.x402))} MoM
                    </span>
                  )}
                </div>
              )
            }
            {history && <Sparkline data={history.x402} />}
            <p className="text-[10px] text-gray-400 mt-1">
              <a href="https://www.npmjs.com/package/x402" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">x402</a>
              {' '}· 基础协议库 · 月 {fmt(data?.x402.npmMonthly)}
            </p>
          </div>

          {/* @coinbase/x402 npm */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] text-gray-400 mb-1">@coinbase/x402 npm 周下载</p>
            {loading
              ? <div className="h-6 bg-gray-200 rounded animate-pulse w-16 mb-2" />
              : (
                <div className="flex items-baseline gap-2 mb-1">
                  <p className="text-xl font-bold text-black">{fmt(data?.x402.coinbaseX402Weekly)}</p>
                  {history && calcMoM(history.coinbaseX402) != null && (
                    <span className={`text-[11px] ${(calcMoM(history.coinbaseX402) ?? 0) >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                      {fmtGrowth(calcMoM(history.coinbaseX402))} MoM
                    </span>
                  )}
                </div>
              )
            }
            {history && <Sparkline data={history.coinbaseX402} />}
            <p className="text-[10px] text-gray-400 mt-1">
              <a href="https://www.npmjs.com/package/@coinbase/x402" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">@coinbase/x402</a>
              {' '}· 官方 SDK · 月 {fmt(data?.x402.coinbaseX402Monthly)}
            </p>
          </div>

          {/* AgentKit npm */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] text-gray-400 mb-1">AgentKit npm 周下载</p>
            {loading
              ? <div className="h-6 bg-gray-200 rounded animate-pulse w-16 mb-2" />
              : (
                <div className="flex items-baseline gap-2 mb-1">
                  <p className="text-xl font-bold text-black">{fmt(data?.agentkit.npmWeekly)}</p>
                  {data?.agentkit.npmGrowthPct != null && (
                    <span className={`text-[11px] font-semibold ${(data.agentkit.npmGrowthPct ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {fmtGrowth(data.agentkit.npmGrowthPct)} WoW
                    </span>
                  )}
                  {history && calcMoM(history.agentkit) != null && (
                    <span className={`text-[11px] ${(calcMoM(history.agentkit) ?? 0) >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                      {fmtGrowth(calcMoM(history.agentkit))} MoM
                    </span>
                  )}
                </div>
              )
            }
            {history && <Sparkline data={history.agentkit} />}
            <p className="text-[10px] text-gray-400 mt-1">
              <a href="https://www.npmjs.com/package/@coinbase/agentkit" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">@coinbase/agentkit</a>
              {' '}· Agent 构建 SDK · 含 x402 支付能力 · 月 {fmt(data?.agentkit.npmMonthly)}
            </p>
          </div>

        </div>
      </div>

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
        <p className="text-sm text-gray-500 mt-1">协议全景 · 需求侧 · 服务侧 · 基础设施 — 动态追踪视角</p>
      </div>

      {/* ── 1. 协议全景（顶部）──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <SectionHeader title="协议全景" sub="两条主轨道 · AP2 兼容层" />

        {/* 两条主轨道说明 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="bg-orange-50 rounded-xl px-4 py-3 border border-orange-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 rounded bg-orange-200 text-orange-700 text-[10px] font-bold">稳定币轨道</span>
              <span className="text-sm font-bold text-gray-800">x402 + USDC</span>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              链上结算，不可逆，适合 <strong>M2M 微支付（&lt;$0.01/次）</strong>。AI Agent 通过 Skill 调用 x402-gated API，
              Facilitator 在 Base 链代付 USDC。
            </p>
          </div>
          <div className="bg-purple-50 rounded-xl px-4 py-3 border border-purple-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 rounded bg-purple-200 text-purple-700 text-[10px] font-bold">法币轨道</span>
              <span className="text-sm font-bold text-gray-800">ACP + Stripe</span>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              信用卡 / Apple Pay，可退款，适合<strong>对话式电商（大额消费）</strong>。ChatGPT / Perplexity 走此轨道。
              Stripe 生成 SPT（单次限额 Token），agent 代用户结账。
            </p>
          </div>
        </div>

        {/* AP2 兼容层 */}
        <div className="mb-4 bg-blue-50 rounded-lg px-4 py-2.5 text-[11px] text-blue-700">
          <span className="font-semibold">AP2（Google）兼容层：</span>
          企业级 agent 授权协议，60+ 机构联合背书，设计为<strong>兼容 x402 与 ACP 双轨</strong>——上层协议无关支付方式，
          可将 x402 微支付或 ACP 法币结算作为子协议接入。规范阶段，尚未主网上线。
        </div>

        {/* 协议对比表 */}
        <div className="space-y-2">
          {PROTOCOLS.map(p => (
            <div key={p.name} className={`border-l-4 ${p.color} bg-gray-50 rounded-r-lg px-4 py-2.5 flex gap-4 items-center`}>
              <div className="w-32 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-gray-900">{p.name}</p>
                  <span className={`text-[9px] px-1 py-0.5 rounded ${p.trackColor} font-medium`}>{p.track}</span>
                </div>
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

        {/* 命名冲突说明 */}
        <div className="mt-3 bg-amber-50 rounded-lg px-4 py-2.5 text-[11px] text-amber-800">
          <span className="font-semibold">⚠ 命名冲突：Virtuals ACP ≠ Stripe ACP</span>
          {' '}两者同名但完全不同协议。Stripe/OpenAI 的 ACP = 消费购物协议（法币轨道）。
          Virtuals 的 ACP = <strong>Agent Commerce Protocol</strong>——Agent 间自主雇佣 / 任务协调 / 4 阶段智能合约 escrow（稳定币轨道）。
          Virtuals 独立设计了这套协议，并选择 x402 作为支付执行层，与 Stripe ACP 无关。
        </div>
      </div>

      {/* ── 2. 架构说明 ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <SectionHeader title="稳定币路径架构" sub="Agent → Skill → x402 → USDC 完整链路" />

        {/* 双向 Agent 经济流 */}
        <div className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-center text-xs mb-2">
            {[
              { label: 'Agent A（Buyer）', sub: 'OpenClaw / Virtuals / AgentKit\n持有链上钱包，自主决策', color: 'bg-blue-50 border-blue-200' },
              { label: '↕ x402 + Facilitator', sub: 'HTTP 402 · EIP-3009 签名\nBase 链 USDC · 亚秒级', color: 'bg-orange-50 border-orange-200' },
              { label: 'Agent B（Seller）', sub: 'Skill 封装为 x402 服务\n自动接单 · 收款 · 继续执行', color: 'bg-green-50 border-green-200' },
            ].map((s, i) => (
              <div key={i} className={`rounded-lg border px-3 py-2.5 ${s.color}`}>
                <p className="font-semibold text-gray-800">{s.label}</p>
                <p className="text-gray-500 text-[10px] mt-0.5 whitespace-pre-line">{s.sub}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 text-center">
            同一个 Agent 可同时扮演两侧角色 · Seller 收 90%，10% 进 ACP Treasury · Firecrawl / Nansen 等外部 API 也是 Seller 侧
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <p className="font-semibold text-gray-700 mb-1">x402 在双向经济中的角色</p>
            <p className="text-gray-500 leading-relaxed">
              x402 是<strong>结算层协议</strong>——任何服务端加一层 402 中间件即可收费，无论是传统 API 还是 Agent Skill。
              Buyer 发请求 → 返回 402 → Facilitator 代付 USDC → Seller 收款。
              npm 下载量衡量的是<strong>服务端开发者采用率</strong>（Seller 侧），不是 Buyer 数量。
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <p className="font-semibold text-gray-700 mb-1">OpenClaw + Virtuals：互补叠加</p>
            <p className="text-gray-500 leading-relaxed">
              OpenClaw = <strong>Agent 运行时</strong>（Skill 执行、本地优先、模型无关）。
              Virtuals = <strong>Agent 经济层</strong>（链上身份、代币化、4 阶段 ACP 任务协调）。
              2026.02 官方集成：OpenClaw Agent → Virtuals ACP 协调 → x402 结算。
              <strong>主流路径 = 两者叠加</strong>，Agent 用 OpenClaw 跑任务，用 Virtuals ACP 赚钱。
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. 需求侧 ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <SectionHeader title="需求侧" sub="AI Agent 生态 · 开发者采用率" badge="Live API" />
        <DemandSection />
      </div>

      {/* ── 4. 服务侧 ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <SectionHeader title="服务侧" sub="谁在收钱 · payTo 地址追踪 → 链上可验证" badge="链上可追踪" />

        {/* x402scan 生态快照 */}
        <div className="mb-4 bg-gray-50 rounded-lg px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">x402scan 独立链上索引 · 快照 2026-03-21</p>
            <a href="https://x402scan.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline">实时榜单 ↗</a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
            <div className="bg-white rounded-lg px-3 py-2 text-center">
              <p className="text-[10px] text-gray-400 mb-0.5">官方月交易量</p>
              <p className="text-lg font-bold text-black">75.4M</p>
              <p className="text-[10px] text-gray-400">x402.org Facilitator 上报</p>
            </div>
            <div className="bg-white rounded-lg px-3 py-2 text-center">
              <p className="text-[10px] text-gray-400 mb-0.5">x402scan 24h 笔数</p>
              <p className="text-lg font-bold text-black">65.3K</p>
              <p className="text-[10px] text-gray-400">链上独立验证</p>
            </div>
            <div className="bg-white rounded-lg px-3 py-2 text-center">
              <p className="text-[10px] text-gray-400 mb-0.5">24h 成交额</p>
              <p className="text-lg font-bold text-black">$67.4K</p>
              <p className="text-[10px] text-gray-400">834 sellers · 3.77K buyers</p>
            </div>
            <div className="bg-white rounded-lg px-3 py-2 text-center">
              <p className="text-[10px] text-gray-400 mb-0.5">最大 Server</p>
              <p className="text-sm font-bold text-black leading-tight">Virtuals Protocol</p>
              <p className="text-[10px] text-gray-400">占 77% 流量</p>
            </div>
          </div>
          <p className="text-[10px] text-gray-400">官方数据约为 x402scan 的 5-10 倍（含 Facilitator 私下上报）。Buyers 少 = 买家几乎全是 AI Agent。</p>
        </div>

        <div className="mb-4 bg-blue-50 rounded-lg px-4 py-3 text-xs text-gray-600 leading-relaxed">
          <span className="font-semibold text-gray-800">payTo 地址是什么？</span>
          {' '}服务商的<strong>收款钱包地址</strong>，包含在 HTTP 402 响应头 <code className="bg-white px-1 rounded text-[10px]">X-Payment-Requirements</code> 中。
          每次 agent 付款 = 一笔 USDC Transfer，Basescan 永久可查。
          <span className="ml-1 text-blue-600 font-medium">V2 Dynamic payTo：探针拿到的通常是 Facilitator 地址而非服务商自己的钱包，隐私问题已被架构解决。</span>
        </div>

        <ProvidersSection />

        <div className="mt-3 bg-amber-50 rounded-lg px-4 py-2.5 text-[11px] text-amber-700">
          <span className="font-semibold">V2 隐私机制：</span>
          90%+ 生产服务商使用 Facilitator（payTo → Facilitator 聚合地址），70%+ 使用 Dynamic payTo per-request 子地址。
          原始服务商钱包几乎不暴露。Firecrawl 被拦截（401 先于 402）是 auth 中间件在 x402 中间件之前的架构选择。
        </div>
      </div>

      {/* ── 5. 基础设施 ────────────────────────────────────────────────────── */}
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
              <span className="font-medium">链上追踪：</span>Facilitator 不持有资金，USDC 直接转入 payTo 地址。CDP Facilitator 提交地址未公开，待从已知 x402 交易中反向提取。
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

      {/* ── 6. 最新进展 ────────────────────────────────────────────────────── */}
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
