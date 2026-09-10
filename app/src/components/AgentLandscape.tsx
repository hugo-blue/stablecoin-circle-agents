'use client'

import { useState } from 'react'
import {
  RELIABILITY, CARD_RAIL, EXCHANGES, FUNDING_IN_WINDOW, FUNDING_PRE_WINDOW_NOTE,
  MARKET_SIZING, MARKET_SIZING_NOTE,
  type Player, type Status, type Conf,
} from '@/lib/data/agent-landscape'

// ── 徽标配置 ──────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<Status, { label: string; cls: string; dot: string }> = {
  live: { label: '已上线', cls: 'text-green-600', dot: 'bg-green-500' },
  pilot: { label: '试点/回落', cls: 'text-amber-600', dot: 'bg-amber-400' },
  announced: { label: '规范阶段', cls: 'text-gray-500', dot: 'bg-gray-400' },
}
const CONF_CFG: Record<Conf, { label: string; cls: string }> = {
  confirmed: { label: '一手', cls: 'bg-green-100 text-green-700' },
  reported: { label: '媒体', cls: 'bg-amber-100 text-amber-700' },
  estimate: { label: '三方', cls: 'bg-red-100 text-red-600' },
}

function Header({ title, sub, badge }: { title: string; sub: string; badge?: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {badge && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">{badge}</span>}
      <span className="text-xs text-gray-400">{sub}</span>
    </div>
  )
}

function PlayerRows({ players }: { players: Player[] }) {
  return (
    <div className="space-y-1.5">
      {players.map(p => {
        const st = STATUS_CFG[p.status]
        const cf = CONF_CFG[p.conf]
        return (
          <div key={p.name} className="bg-gray-50 rounded-lg px-4 py-2.5 flex gap-4 items-start">
            <div className="w-40 flex-shrink-0">
              <p className="text-sm font-bold text-gray-900 leading-tight">{p.name}</p>
              {p.by && <p className="text-[10px] text-gray-400">{p.by}</p>}
              <span className={`inline-flex items-center gap-1 text-[10px] mt-1 ${st.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 leading-relaxed">{p.product}</p>
              <p className="text-[11px] text-gray-500 mt-1">
                <span className="text-gray-400">关键：</span>{p.fact}
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${cf.cls}`}>{cf.label}</span>
              <p className="text-[10px] text-gray-400 mt-1 tabular-nums">{p.date}</p>
              <a href={p.href} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-500 hover:underline">↗</a>
            </div>
          </div>
        )
      })}
    </div>
  )
}

type Tab = 'card' | 'exchange' | 'funding' | 'market'
const TABS: { key: Tab; label: string }[] = [
  { key: 'card', label: '卡组织轨 & 大厂' },
  { key: 'exchange', label: '交易所 agent' },
  { key: 'funding', label: '融资追踪' },
  { key: 'market', label: '市场规模' },
]

export function AgentLandscape() {
  const [tab, setTab] = useState<Tab>('card')

  return (
    <>
      {/* ── 数字可信度（校准本页 x402 派生数字）───────────────────────────── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <Header title="数字可信度" sub="哪些数能信 · 哪些别当现值" badge="必读" />
        <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
          本页上方的 x402scan 买方数 / CDP 日均 tx 等是<strong>实时链上抓取</strong>，可信；但业界最常被引用的 x402 累计总量
          （及「Agentic GDP $470M+」一类）多源自<strong>一个自 2026-03 冻结的计数器</strong>，且含大量刷量/自成交。以下为交叉核验后的取舍。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border-l-4 border-green-400 bg-green-50/60 px-4 py-3">
            <p className="text-sm font-bold text-green-700 mb-2">✓ 可信</p>
            <div className="space-y-2.5">
              {RELIABILITY.trustworthy.map((t, i) => (
                <div key={i}>
                  <p className="text-[11px] text-gray-700 leading-relaxed">{t.text}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {t.href
                      ? <a href={t.href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{t.source} ↗</a>
                      : t.source}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border-l-4 border-red-400 bg-red-50/60 px-4 py-3">
            <p className="text-sm font-bold text-red-600 mb-2">✗ 别当现值</p>
            <div className="space-y-2.5">
              {RELIABILITY.doubtful.map((t, i) => (
                <div key={i}>
                  <p className="text-[11px] text-gray-700 leading-relaxed">{t.text}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {t.href
                      ? <a href={t.href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{t.source} ↗</a>
                      : t.source}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 全景补强（卡组织轨 / 交易所 / 融资 / 市场）──────────────────────── */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <Header title="全景补强" sub="x402 之外：卡组织轨 · 交易所 · 融资 · 市场" badge="静态" />

        <div className="flex flex-wrap gap-1.5 mb-4">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                tab === t.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'card' && (
          <>
            <p className="text-[11px] text-gray-500 mb-3">
              卡组织与大厂走「代币化受限凭证」路线：网络发放<strong>一次性、限额、可撤销</strong>的 token，agent 永不持有卡号。
              与稳定币轨正在合流（Visa/Mastercard/Ripple 2026-07 加入 x402）。
            </p>
            <PlayerRows players={CARD_RAIL} />
          </>
        )}

        {tab === 'exchange' && (
          <>
            <p className="text-[11px] text-gray-500 mb-3">
              五大交易所都已上线 agent <strong>交易</strong>产品（经 MCP + 禁提现沙盒子账户）；agent <strong>支付</strong>仍多为轨道/公告。
            </p>
            <PlayerRows players={EXCHANGES} />
          </>
        )}

        {tab === 'funding' && (
          <>
            <p className="text-[11px] text-gray-500 mb-3">
              窗口内（2026-03 至 09）真融资。资金主题是<strong>「让 agent 安全付钱」</strong>（轨道/信任/合规），
              而非「让 agent 自主交易自己的仓位」——后者窗口内无可核实融资。
            </p>
            <div className="space-y-1.5">
              {FUNDING_IN_WINDOW.map(f => (
                <div key={f.company} className="bg-gray-50 rounded-lg px-4 py-2.5 flex gap-4 items-center">
                  <div className="w-32 flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{f.company}</p>
                    <p className="text-[10px] text-gray-400 tabular-nums">{f.date}</p>
                  </div>
                  <p className="flex-1 text-xs text-gray-600 min-w-0">{f.what}</p>
                  <div className="flex-shrink-0 text-right w-40">
                    <p className="text-sm font-bold text-gray-900 tabular-nums">{f.amount}
                      <span className="ml-1 text-[10px] font-normal text-gray-400">{f.round}</span>
                    </p>
                    <p className="text-[10px] text-gray-500">{f.investors}</p>
                    <a href={f.href} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-500 hover:underline">↗</a>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 bg-gray-100 rounded-lg px-3 py-2 text-[10px] text-gray-500 leading-relaxed">{FUNDING_PRE_WINDOW_NOTE}</p>
          </>
        )}

        {tab === 'market' && (
          <>
            <p className="text-[11px] text-gray-500 mb-3">
              全为 2030 预测。<strong>先看定义，再看数字。</strong>
            </p>
            <div className="space-y-1.5">
              {MARKET_SIZING.map(m => (
                <div key={m.source} className="bg-gray-50 rounded-lg px-4 py-2.5 flex gap-4 items-center">
                  <p className="w-28 flex-shrink-0 text-base font-bold text-gray-900 tabular-nums">{m.figure}</p>
                  <p className="flex-1 text-xs text-gray-600 min-w-0">{m.measures}</p>
                  <p className="w-16 flex-shrink-0 text-center text-xs text-gray-500 tabular-nums">{m.by}</p>
                  <div className="w-36 flex-shrink-0 text-right">
                    <p className="text-[11px] text-gray-600">{m.source}</p>
                    <p className="text-[10px] text-gray-400 tabular-nums">{m.date} · 预测</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 bg-gray-100 rounded-lg px-3 py-2 text-[10px] text-gray-500 leading-relaxed">{MARKET_SIZING_NOTE}</p>
          </>
        )}

        <p className="mt-3 text-[10px] text-gray-400">
          静态数据 · 更新于 2026-09-10 · 三条独立研究流交叉核验，每条 fact 带来源与置信度 · 见 <span className="font-mono">lib/data/agent-landscape.ts</span>
        </p>
      </div>
    </>
  )
}
