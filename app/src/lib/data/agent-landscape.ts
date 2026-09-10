/**
 * AI Agent 支付 — 全景补强（静态）
 *
 * 补充 /ai-payments 现有的 x402 实时看板：卡组织轨玩家、交易所 agent 产品、
 * 融资追踪、市场规模，以及一层「数字可信度」——校准本页展示的 x402 派生数字。
 *
 * Sources（每条 fact 对应下方 src）：
 * - Keyrock「Who Pays the Agent?」 via CoinDesk 2026-05-21
 * - Artemis × Visa「Agentic Payments from the Ground Up」2026-07（过滤截至 2026-04-21）
 * - Chainalysis「Inside x402」2026-06-03
 * - 各公司新闻稿 / 官方博客 / 路透·CNBC·TechCrunch·The Block·CoinDesk·Fortune
 *
 * 置信度：confirmed=一手/官方 · reported=可靠媒体 · estimate=三方/低置信
 * Last updated: 2026-09-10
 */

export type Conf = 'confirmed' | 'reported' | 'estimate'
export type Status = 'live' | 'pilot' | 'announced'

// ── 数字可信度 ────────────────────────────────────────────────────────────────
export interface TrustItem {
  text: string
  source: string
  href?: string
}
export const RELIABILITY: { trustworthy: TrustItem[]; doubtful: TrustItem[] } = {
  trustworthy: [
    {
      text: 'Keyrock（含 Coinbase/Tempo，截至 2026-04 的 12 个月）：链上 agent 结算约 $73M / 1.76 亿笔，98.6% 用 USDC，约 10.4 万个 agent，76% 的交易低于 Visa $0.30 手续费门槛。',
      source: 'CoinDesk · 2026-05-21',
      href: 'https://www.coindesk.com/business/2026/05/21/crypto-rails-are-becoming-the-default-payment-layer-for-ai-agents-report-says',
    },
    {
      text: 'Artemis × Visa（过滤刷量/测试后，截至 2026-04）：真实约 $15M 累计 / 约 $28K/天，真实卖家约 5,300 家——比未过滤口径低一个数量级。',
      source: 'Artemis/Visa · 2026-07',
      href: 'https://www.coindesk.com/tech/2026/07/15/visa-mastercard-and-ripple-join-the-standard-letting-ai-agents-pay-in-stablecoins',
    },
    {
      text: 'Chainalysis：噪声之下有真实内核——$1+ 支付占比从 49% 升到 95%，试用→付费转化 6 个月涨 4×。',
      source: 'Chainalysis · 2026-06-03',
      href: 'https://www.chainalysis.com/blog/x402-agentic-payments-adoption/',
    },
    {
      text: 'Visa（2025-12）：完成「数百笔」agent 交易、100+ 生态伙伴、30+ 在沙盒——唯一披露过的硬一手卡组织指标。',
      source: 'Visa 新闻室 · 2025-12-18',
      href: 'https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21961.html',
    },
  ],
  doubtful: [
    {
      text: 'x402.org 计数器（约 7,541 万笔 / $2,424 万 / 9.4 万买家）自 2026-03 未再更新，却被到处当作现值引用——本页 x402scan / CDP 实时看板应与其明确区分。',
      source: 'danielmcglynn.com · 2026-09-06',
      href: 'https://www.danielmcglynn.com/the-x402-counter-has-shown-the-same-four-numbers-since-march/',
    },
    {
      text: '「1.65 亿笔 / $5,000 万 / 6.9 万 agent」（Agent.market 上线快照）= 同一冻结数据源，勿与其它 x402 数字相加。',
      source: 'Coinbase 快照 · 2026-04',
    },
    {
      text: '「Agentic GDP / $470M+」一类总量：未过滤，含大量自成交/测试流；作为「真实成交」阅读会高估约一个数量级。',
      source: 'Artemis/Visa 过滤法 · 2026',
    },
    {
      text: '任何「agentic 结算 TPV/GMV」：无一玩家（OpenAI/Amazon/Visa/Stripe…）披露过。700M 周活、2.5 亿 Rufus 用户等只是漏斗触达，不是 agent 完成的成交。',
      source: '多方交叉核验 · 2026',
    },
  ],
}

// ── 玩家（卡组织轨 / 大厂 / 交易所）────────────────────────────────────────────
export interface Player {
  name: string
  by?: string
  product: string
  status: Status
  fact: string
  date: string
  conf: Conf
  href: string
}

export const CARD_RAIL: Player[] = [
  {
    name: 'Visa Intelligent Commerce', product: '代币化 Visa 凭证绑定 agent + 用户限额；Trusted Agent Protocol = agent 身份（与 Cloudflare）',
    status: 'pilot', fact: '「数百笔」agent 交易、100+ 伙伴；2026-07 加入 x402', date: '2025-04→', conf: 'confirmed',
    href: 'https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21961.html',
  },
  {
    name: 'Mastercard Agent Pay', product: 'Agentic Tokens 绑定卡到 agent + 商户；AP4M 扩到机器微支付（含稳定币）',
    status: 'pilot', fact: 'AP4M 30+ 伙伴上线；收购 BVNK 约 $1.8B', date: '2026-06-10', conf: 'reported',
    href: 'https://investor.mastercard.com/investor-news/investor-news-details/2026/Mastercard-Launches-Agent-Pay-for-Machines-to-Unlock-Super-Fast-Always-On-Payments/default.aspx',
  },
  {
    name: 'Google AP2', by: '+ A2A / UCP', product: '签名「授权书」协议；A2A 150+ 组织 v1.0；UCP 商务标准（与 Shopify）',
    status: 'announced', fact: '100+ 伙伴；捐给 FIDO 联盟', date: '2025-09→', conf: 'confirmed',
    href: 'https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol',
  },
  {
    name: 'Stripe × OpenAI ACP', product: '开放结算标准；Shared Payment Token 单次限额；ChatGPT 内实时；MPP（与 Tempo）',
    status: 'live', fact: 'Stripe 全年 TPV $1.9T；Bridge 稳定币量 4×', date: '2025-09-29', conf: 'reported',
    href: 'https://stripe.com/newsroom/news/stripe-openai-instant-checkout',
  },
  {
    name: 'OpenAI Instant Checkout', product: 'ChatGPT 内购买；已转向商户「Apps」方向',
    status: 'pilot', fact: '700M 周活，但仅约 12 家商户真上线；2026-03 下线原生结算', date: '2026-03', conf: 'reported',
    href: 'https://rye.com/blog/openai-chatgpt-checkout-agentic-commerce',
  },
  {
    name: 'PayPal Agentic Commerce', product: '现有商户经 ACP + UCP 收 agent 付款；驱动 Copilot / Perplexity 结算',
    status: 'live', fact: '4 亿+ 账户、约 3,500 万商户；实质营收框定「2028+」', date: '2025-10-28', conf: 'reported',
    href: 'https://newsroom.paypal-corp.com/2025-10-28-PayPal-Launches-Agentic-Commerce-Services-to-Power-AI-Driven-Shopping',
  },
  {
    name: 'Amazon Buy for Me / AgentCore', product: 'agent 在外部站购买；AWS Bedrock AgentCore = agent 经 x402/USDC 付费',
    status: 'live', fact: 'Alexa/Rufus 2.5 亿+ 用户；AgentCore 与 Coinbase/Stripe 共建（预览）', date: '2026-05', conf: 'reported',
    href: 'https://aws.amazon.com/blogs/machine-learning/agents-that-transact-introducing-amazon-bedrock-agentcore-payments-built-with-coinbase-and-stripe/',
  },
  {
    name: 'Shopify UCP', product: '开放 agent 发现/结算；公共 MCP 端点；Shop Pay 支持 USDC',
    status: 'live', fact: 'Q2’26 GMV $116B（+32%），AI 流量同比 3×', date: '2026-08-05', conf: 'reported',
    href: 'https://www.pymnts.com/earnings/2026/shopifys-ai-traffic-triples-as-shoppers-skip-the-search-bar/',
  },
  {
    name: 'Microsoft Copilot Checkout', product: 'Copilot 内购买；由 PayPal + Shopify + Stripe 驱动；支持 UCP',
    status: 'live', fact: '19.2 万+ 商户经 Copilot 购物可用', date: '2026-01-08', conf: 'reported',
    href: 'https://newsroom.paypal-corp.com/2026-01-08-PayPal-Powers-Microsofts-Launch-of-Copilot-Checkout',
  },
]

export const EXCHANGES: Player[] = [
  {
    name: 'Binance', product: 'AI Pro（agent 交易）+ Agent OS（MCP 开发平台）',
    status: 'live', fact: '经禁提现子账户交易；限额为用户自设、非交易所强制', date: '2026-03 / 08', conf: 'reported',
    href: 'https://techcrunch.com/2026/08/20/binance-now-lets-ai-agents-trade-but-keeping-them-in-check-is-largely-up-to-users/',
  },
  {
    name: 'Coinbase', product: '「Coinbase for Agents」(MCP) + CDP Agentic Wallets + x402',
    status: 'live', fact: 'MCP 让 ChatGPT/Claude 交易你的账户；钱包每次调用可设限额', date: '2026-06-11', conf: 'confirmed',
    href: 'https://www.coindesk.com/tech/2026/06/11/coinbase-launches-ai-agent-accounts-that-can-trade-and-spend-on-your-behalf',
  },
  {
    name: 'OKX', product: 'Agentic Wallet + AI agent 市场',
    status: 'live', fact: '60+ 链 / 500+ DEX；TEE 密钥；agent 互相雇佣并付费', date: '2026-03-18', conf: 'reported',
    href: 'https://techcrunch.com/2026/06/30/crypto-exchange-okx-wants-ai-agents-to-hire-and-pay-each-other/',
  },
  {
    name: 'Bybit', product: 'AI Trading Skill + Bybit AI',
    status: 'live', fact: '253 个 API 端点；经外部助手交易；约 8,000 万用户（自报）', date: '2026-03-13', conf: 'reported',
    href: 'https://chainwire.org/2026/03/13/bybit-launches-ai-skills-powering-ai-agents-for-crypto-trading-with-zero-setup-253-api-endpoints-and-growing/',
  },
  {
    name: 'Bitget', product: 'GetAgent + 专属 AI 交易账户',
    status: 'live', fact: '流传的「$1.2B」是 14 天媒体曝光量、非交易量（勘误）', date: '2026-04-06', conf: 'reported',
    href: 'https://www.globenewswire.com/news-release/2026/04/06/3268287/0/en/Bitget-Gives-AI-Its-Own-Trading-Account-Advancing-Toward-an-Agent-Native-Exchange.html',
  },
]

// ── 融资追踪 ──────────────────────────────────────────────────────────────────
export interface Funding {
  company: string
  what: string
  amount: string
  round: string
  investors: string
  date: string
  href: string
}
export const FUNDING_IN_WINDOW: Funding[] = [
  { company: 'Circle (Arc)', what: 'USDC-gas L1，稳定币 + agentic 金融', amount: '$222M', round: '代币预售', investors: '~$3B 估值', date: '2026-05-11', href: 'https://finance.yahoo.com/markets/crypto/articles/circle-gives-ai-agents-usdc-211546876.html' },
  { company: 'Freehand', what: '企业供应链 agent 支出自动化', amount: '$75M', round: 'B 轮', investors: 'Battery, NewRoad', date: '2026-07-29', href: 'https://gravity.fast/blog/ai-agent-funding-tracker-q3-2026/' },
  { company: 'Natural', what: 'agent 支付轨道（「对标 Stripe」）', amount: '$30M', round: 'A 轮', investors: 'Forerunner', date: '2026-07-20', href: 'https://techcrunch.com/2026/07/20/natural-raises-30m-to-reinvent-payments-for-ai-agents-and-take-on-stripe/' },
  { company: 'Catena Labs', what: 'AI 原生受监管银行；Agent Commerce Kit', amount: '$30M', round: 'A 轮', investors: 'a16z crypto, Acrew', date: '2026-05-20', href: 'https://fortune.com/2026/05/20/catena-labs-series-a-sean-neville-ai-native-bank/' },
  { company: 'Turnkey', what: '安全域钱包/密钥；agentic 支付', amount: '$12.5M', round: '战略', investors: 'Circle Ventures, Sequoia', date: '2026-05-06', href: 'https://www.coindesk.com/business/2026/05/06/turnkey-raises-usd12-5-million-in-round-backed-by-circle-ventures-and-sequoia-capital' },
  { company: 'Nava', what: '约束金融 agent 的信任/托管层', amount: '$8.3M', round: '种子', investors: 'Polychain, Archetype', date: '2026-04-14', href: 'https://fortune.com/2026/04/14/nava-seed-funding-ai-financial-agents/' },
  { company: 'AEON', what: '结算层；BNB 链 x402 facilitator', amount: '$8M', round: 'Pre-seed', investors: 'YZi Labs（前币安 Labs）', date: '2026-05-18', href: 'https://www.theblock.co/post/401601/aeon-raises-8-million-yzi-labs' },
  { company: 'AIsa', what: 'agent 付费买数据/API 的统一交易 API', amount: '$6.5M', round: '种子', investors: '阿里巴巴, Tribe Capital', date: '2026-07-03', href: 'https://www.forbes.com/sites/elainepofeldt/2026/07/03/startup-raises-65-million-by-making-it-easier-for-ai-employees-to-make-payments-online/' },
]
export const FUNDING_PRE_WINDOW_NOTE =
  '窗口外旧融资（背景）：Kite $18M（2025-09，PayPal Ventures）、Crossmint $23.6M（2025-03）、Halliday $20M（2025-03）、Skyfire $9.5M（2024）、Payman ~$13.8M（2024）；钱包层并购 Privy→Stripe（2025-06）、Dynamic→Fireblocks（2025-10，价格均未披露）。'

// ── 市场规模（每条紧跟定义）──────────────────────────────────────────────────
export interface MarketSize {
  figure: string
  measures: string
  by: string
  source: string
  date: string
}
export const MARKET_SIZING: MarketSize[] = [
  { figure: '$1.5T', measures: '全球 agentic 商务支出', by: '2030', source: 'Juniper Research', date: '2026-04-07' },
  { figure: '$300–500B', measures: '美国 agentic 商务（占美电商 15–25%）', by: '2030', source: 'Bain & Company', date: '2025-12-17' },
  { figure: '$190–385B', measures: '美国 agentic 商务影响', by: '2030', source: 'Morgan Stanley', date: '2026' },
  { figure: '$1T / $3–5T', measures: '美国 / 全球编排式零售', by: '2030', source: 'McKinsey', date: '2025-10' },
  { figure: '$985B', measures: 'agentic-AI 软件支出（62.7% CAGR）', by: '2030', source: 'Gartner（二手）', date: '2026' },
]
export const MARKET_SIZING_NOTE =
  '35× 的区间几乎全是「定义」差异（AI 影响 vs AI 自主完成；美国 vs 全球），不是增长判断分歧。任何一个数字都不要脱离其定义单独引用。'
