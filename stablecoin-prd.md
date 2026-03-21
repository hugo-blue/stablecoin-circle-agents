# 稳定币数据平台 PRD v1.3

> 状态：设计阶段 | 版本：1.3 | 日期：2026-03-21
> 变更（v1.3）：M5 AI支付生态全面重写——从技术层架构改为市场角色视角（需求侧/服务侧/协议/基础设施/新闻）；新增 AP2/ACP/MPP 协议对比；更新 OpenClaw 真实数据；明确 x402 payTo 地址追踪机制
> 变更（v1.2）：去除 Nansen；优化 API 成本策略；调整优先级；重新定义 M4/M5；新增 Circle 产品体系

---

## 一、产品概述

### 1.1 产品定位
面向机构研究员、加密投资者、支付从业者的**稳定币全景追踪平台**。

核心价值主张：
- **聚合**：将分散在多个平台的稳定币数据整合到一处
- **独特挖掘**（护城河）：
  - Circle 财务可视化解读（含利息收入估算模型）
  - 用途分类视角的链上流向分析（自建地址标签库）
  - AI 支付生态系统性追踪（市面空白）

### 1.2 目标用户
| 用户类型 | 核心诉求 | 优先级 |
|---------|---------|-------|
| 加密机构研究员 | 市场对比、趋势、Circle 财务 | P0 |
| DeFi 投资者 | 协议资金流入/流出 | P1 |
| 支付/Web3 开发者 | AI 支付生态数据 | P1 |
| 支付从业者 | 跨境支付走廊 | P2 |

### 1.3 开发优先级（本次 PRD 范围）
```
Phase 1（MVP）：M1 宏观全景 + M3 USDC/Circle + M5 AI支付生态
Phase 2：M2 USDT 深度 + M4 流向分析（用途分类版）
```

---

## 二、功能模块设计

### 模块 M1：宏观全景（Market Overview）
**页面路径**：`/`

#### M1.1 核心指标卡（60s 刷新）
| 指标 | 数据源 | 成本 |
|-----|--------|------|
| 各稳定币市值及占比 | CoinGecko Free API | 免费 |
| 24h/7D 变化趋势 | CoinGecko Free API | 免费 |
| 各链分布总览 | DefiLlama Stablecoins API | 免费 |
| 全网日转账量 | DefiLlama | 免费 |
| 脱锚预警（±0.5%） | CoinGecko Price API | 免费 |

#### M1.2 市占率历史趋势
- 类型：100% 面积堆叠图（各币种占比之和=100%）
- 时间粒度：7D / 30D / 1Y / ALL（可切换）
- 维度：USDT、USDC、DAI、FDUSD、PYUSD、其他
- 数据源：DefiLlama `/stablecoincharts/all?stablecoin={id}`（免费，日度）
  - 分别请求各主要稳定币的历史流通量，合并计算每日占比
  - 注意：`date` 字段为 Unix 时间戳字符串（非数字）
- ~~原方案 CoinGecko Historical Market Cap 弃用~~：CoinGecko 免费版历史数据受限

#### M1.3 各链分布热力图
- 横轴：稳定币（USDT/USDC/DAI/FDUSD）
- 纵轴：公链（Ethereum/Tron/Solana/BNB/Arbitrum/Base/Polygon）
- 数据源：DefiLlama Stablecoins API（免费）

#### M1.4 发行 vs 赎回净流量
- 时间粒度：**日度**（默认）/ 周度 / 月度（三档可切换）
- 类型：瀑布图（正=净发行，负=净赎回）
- 数据来源说明（重要修正）：
  - ~~原方案：使用 DefiLlama 返回的 minted/burned 字段~~
  - **实际问题**：`burned` 字段在部分币种不存在；`minted` 字段类型不一致（可能是 `0` 或 `{peggedUSD: number}`）
  - **修正方案**：通过每日流通量差值推算净流量
    ```
    净流量(日) = 当日 circulating.peggedUSD - 前一日 circulating.peggedUSD
    正值 = 净发行（Mint > Burn）
    负值 = 净赎回（Burn > Mint）
    ```
  - 数据本质：DefiLlama 的 `circulating.peggedUSD` 来自链上合约 `totalSupply()` 每日快照，与监听 Mint/Burn 事件等价
- 数据源：DefiLlama `/stablecoincharts/all?stablecoin={id}`（**免费，日度**）
- DefiLlama 稳定币 ID 映射：USDT=1, USDC=2, DAI=3, FDUSD=4

#### M1.5 动态新闻流（新增）
- 位置：首页右侧边栏或底部
- 标签分类：`USDT` / `USDC` / `AI支付` / `监管` / `其他`
- 内容：标题 + AI摘要（≤50字）+ 来源 + 时间 + 风险等级徽章
- 风险等级：🔴 高风险 / 🟡 关注 / 🟢 积极
- 数据源：RSS（CoinDesk/The Block/Cointelegraph）+ **Claude API 做摘要和分类**
- 对应模块可过滤：在 USDC 页只展示 USDC 标签新闻
- 💰 成本标注：Claude API 摘要，按 token 计费，可控制频率（建议30分钟一批处理）

---

### 模块 M3：USDC / Circle 深度追踪
**页面路径**：`/usdc`

#### M3.1 USDC 链上总览
| 指标 | 粒度 | 数据源 | 成本 |
|-----|------|--------|------|
| 总发行量 | 实时 | DefiLlama | 免费 |
| 各链分布（占比+金额） | 日度 | DefiLlama | 免费 |
| 日净发行/赎回 | 日度 | DefiLlama | 免费 |
| 7D / 30D 趋势迷你图 | 日度 | DefiLlama | 免费 |

重点标注链：Ethereum、Base、Solana、Arbitrum、Polygon

#### M3.2 Circle 财务追踪（核心差异化模块）

**数据来源说明（重要修正）**：
- Circle 于 **2025年6月5日** IPO（NYSE: CRCL，$31/股），非2024年
- S-1 招股书（2025-04-01 提交）：含 FY2022/2023/2024 审计年报 + Q1 2025 未审计季报
- 10-Q 季报：Q2 2025、Q3 2025
- 10-K 年报：FY2025（2026-02-25 发布）
- **有真实财报数据的季度**：2024-Q1 起（来自 S-1），2025-Q2 起（来自 10-Q）

**渠道成本与 Coinbase 分成（核心独特分析）**：
- Coinbase 持有的 USDC：Coinbase 获得 **100% 储备利息**
- 链下 USDC：Circle 与 Coinbase **50/50 分成**
- 2024年 Coinbase 获得 **$908M**（占 Circle 总收入的 54%）
- 渠道成本占比逐年上升：2022年37% → 2024年60%
- 协议每 3 年续签一次，下次 2026 年
- Coinbase 持有 USDC 占比：2022年5% → 2025年22%

**指标设计**：

| 指标 | 展示形式 | 时间粒度 | 数据来源 |
|-----|---------|---------|---------|
| 季度总收入 | 柱状图 + 同比增长率 | 季度 / 年度 | SEC EDGAR（免费）|
| 利息收入 vs 服务费收入 | 堆叠柱状图 + 占比 | 季度 / 年度 | SEC EDGAR |
| 净利润率 | 折线图 + 数值标注 | 季度 / 年度 | SEC EDGAR |
| 储备资产规模 | 面积图 | 月度 | Circle 官方披露 |
| **利息收入估算模型** | 估算值 vs 实际值对比折线 | 月度 | 储备规模×美债利率（计算字段）|
| USDC 流通量与收入相关性 | 散点图 | 季度 | 联合计算 |

**切换维度**：支持按季度/年度两档切换，每个指标卡附带同比/环比变化数字。

#### M3.3 Circle 核心产品体系追踪

**Circle 的产品线和收入来源**：

| 产品 | 说明 | 可追踪指标 | 数据源 | 成本 |
|-----|------|----------|--------|------|
| **USDC 储备利息** | 最大收入来源 | 储备规模（链上）× 美债利率 | DefiLlama + 美联储数据 | 免费 |
| **CCTP（跨链转账协议）** | USDC 原生跨链销毁+重铸机制 | 跨链日转账量、笔数、主要链对 | The Graph 子图 | 免费 |
| **CPN（Circle Payments Network）** | 2025年新品，面向银行跨境结算 | 合作机构公告追踪（定性） | 新闻+Circle官网 | 免费 |
| **Circle Mint** | 机构铸造/赎回服务 | 净发行量变化作代理指标 | DefiLlama | 免费 |
| **EURC（欧元稳定币）** | MiCA 合规欧元稳定币 | 发行量、各链分布 | DefiLlama | 免费 |
| **Programmable Wallets API** | 开发者托管钱包 | 活跃钱包数（估算） | Base/Ethereum 链上 | 免费 |

**CCTP 跨链流量看板**：
- 类型：Sankey 图（链对之间的日流量）
- 主要链对：ETH↔Base、ETH↔Arbitrum、ETH↔Solana、ETH↔Polygon
- 数据源：The Graph CCTP 子图（**免费**）

#### M3.4 USDC 储备透明度
- Circle 月度储备报告：现金、短期国债、回购协议各占比
- 类型：饼图 + 历次报告时间轴对比
- 数据源：Circle 官方储备报告页面（人工录入 + 每月更新）

#### M3.5 重要新闻追踪（替换原合作伙伴地图）
- 展示：仅展示 USDC/Circle 标签的新闻条目
- 来源：与 M1.5 同一新闻流，按标签过滤
- 重点关注：监管合规、CPN 合作公告、储备审计、产品发布

---

### 模块 M4：流向分析 — 用途分类视角
**页面路径**：`/flows`
**开发阶段**：Phase 2

> 核心重新定义：不是展示"钱从A流到B"，而是回答"谁在用稳定币、用在哪、量在增减"

#### M4.1 用途分类占比（独特挖掘）

将链上稳定币使用分为以下用途，通过地址标签库识别：

| 用途类别 | 识别方法 | 代表地址/协议 |
|---------|---------|------------|
| **DeFi 借贷** | 已知借贷合约地址 | Aave、Compound、MakerDAO |
| **DEX 流动性** | 已知 DEX 合约地址 | Uniswap、Curve、Balancer |
| **CEX 托管** | 已知交易所热钱包 | Binance、Coinbase、OKX |
| **跨链桥** | 已知桥合约地址 | Across、Stargate、Hop |
| **企业支付** | 行为特征（见下）+ 已知支付商地址 | Stripe、Circle Payouts |
| **跨境汇款** | 已知汇款走廊聚合商地址 | Bitso、Coins.ph、Chipper |
| **休眠/长持** | 地址活跃度极低 | — |
| **未识别** | 无标签，显示估算占比 | — |

**地址标签库建设策略**（低成本路径）：
1. Etherscan 公开标签 API（免费）
2. DefiLlama Protocol 合约地址（免费）
3. 社区维护的 labels 数据集（GitHub 开源）
4. 自建：对未识别大额地址做人工研究，逐步扩充

💰 **付费 API 标注**：Dune Analytics 查询可大幅加速（$49/月 免费版有限额，付费版 $349/月），MVP 阶段用 Etherscan + 开源标签替代。

#### M4.2 增量/减量来源分析（核心差异化）
- 问题：近30天 USDC 新增发行 $X 亿，**主要流向哪些用途类别**？
- 展示：净变化量按用途类别拆分的横向条形图
- 洞察示例：「本月 DeFi 借贷占比下降 8%，企业支付地址流入增加 $2.1B，主要来自 3 个新识别的大额地址」

#### M4.3 交易所净流量
- 展示：主流 CEX 稳定币净流入/流出（日度）
- 数据源：已知 CEX 热钱包地址 + Etherscan API（**免费**）
- 💰 付费替代：CryptoQuant API（$299/月），数据更全面准确

#### M4.4 大额转账追踪（鲸鱼地址）
- 阈值：单笔 > $5M
- 展示：实时列表，含发送方标签 / 接收方标签 / 金额 / 判断（DeFi存入/CEX充值/未知）
- 💰 数据源：Etherscan API（免费版2000次/天，**付费版 $49/月** 无限制），Tronscan API（免费）

---

### 模块 M5：AI 支付生态专题
**页面路径**：`/ai-payments`

> **核心设计原则**：按市场角色组织，而非技术层级。动态可追踪数据优先，静态信息作为背景补充。

#### M5.0 页面结构（五个区块）

```
需求侧   → 服务侧   → 协议对比  → 基础设施  → 新闻动态
（谁付钱） （谁收钱） （用什么标准）（底层怎么跑）（最新进展）
  动态数据   链上可追踪   静态对比表   静态参考    RSS/API
```

**各区块数据追踪优先级**：
- 需求侧：中（GitHub API、公开 MAU 数据）
- 服务侧：高（链上 USDC Transfer 事件，完全可追踪）
- 协议对比：低（静态，季度更新）
- 基础设施：低（静态参考）
- 新闻动态：中（RSS 自动抓取，后续接入）

---

#### M5.1 需求侧追踪

**目标**：追踪真实在用 agent 框架的规模和支付就绪度。

**M5.1.1 x402 原生 Agent 框架**

| 框架 | 可追踪指标 | 数据源 | 成本 |
|-----|-----------|--------|------|
| OpenClaw | GitHub Stars、ClawHub Skills总数、付费Skills数 | GitHub API（公开）| 免费 |
| Coinbase AgentKit | GitHub Stars、npm下载量 | GitHub API + npm | 免费 |
| Bino | x402.org/ecosystem 收录状态 | x402 官网 | 免费 |

**OpenClaw 基准数据（2026-03-21）**：
- GitHub Stars：247,000+（史上增速最快，60天超越 React）
- 月活跃用户：2,700万（月增长 925%）
- ClawHub 技能总数：13,729
- 金融类技能：311+（含 DeFi / 加密支付 / 交易）
- 企业用户占比：65%，金融行业 25%（最大板块）
- 链上支付就绪状态：社区 skill 层（CoinFello+MetaMask 已上线），官方核心仍 API Key

**M5.1.2 主流 AI 产品支付就绪度**（定性追踪，季度更新）

| 产品 | MAU | 采用协议 | 状态 |
|-----|-----|---------|------|
| ChatGPT | 3亿+ | ACP/SPT（Stripe） | Instant Checkout 已上线 |
| Microsoft Copilot | 数亿 | ACP/SPT | ACP 合作方 |
| Perplexity | 1,500万+ | ACP/SPT | ACP 合作方 |
| Cursor / Replit / Bolt | 数百万 | ACP/SPT | ACP 合作方 |

---

#### M5.2 服务侧追踪（核心定量模块，链上可验证）

**追踪原理**：x402 服务商在 402 响应头 `X-Payment-Requirements` 中暴露 `payTo` 钱包地址，监听该地址的 USDC Transfer 事件即可追踪真实收款流水。

```
步骤一：对已知 x402 端点发起 HTTP 请求
步骤二：从 402 响应头提取 payTo 地址
步骤三：监听 USDC 合约 Transfer 事件，to = payTo 地址
步骤四：聚合统计日交易量、笔数、平均单价
```

**USDC 合约地址（结算资产）**：
- Base 主网：`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Solana：`EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- 监听事件：`Transfer(address indexed from, address indexed to, uint256 value)`
- 精度：6 位小数（USDC 标准）

**服务商分类与追踪状态**：

| 分类 | 服务商 | x402 端点 | payTo 状态 | 单价 |
|-----|-------|-----------|-----------|------|
| 网页数据 | Firecrawl | `api.firecrawl.dev/v1/x402/search` | 端点已知，地址待抓取 | — |
| 网页数据 | Zyte API | — | 待验证 | — |
| 社交数据 | Neynar | — | 待验证 | — |
| 链上数据 | Einstein AI | — | 待验证 | — |
| 链上数据 | WalletIQ | — | 价格已知 | $0.005/次 |
| AI 推理 | BlockRun.AI | — | 待验证 | — |
| AI 推理 | AskClaude | — | 价格已知 | $0.01–$0.10 |
| AI 推理 | Obol | — | 价格已知 | $5.00/次 |
| 存储 | Pinata | — | 待验证 | — |
| 电商 | Bitrefill | — | 待验证 | — |

**M5.2 汇总指标**（数据接入后展示）：

| 指标 | 粒度 | 数据源 | 成本 |
|-----|------|--------|------|
| x402 日交易笔数 | 日度 | Basescan Transfer 事件 | 免费 |
| x402 日交易量（USDC） | 日度 | Basescan | 免费 |
| Base vs Solana 占比 | 日度 | Basescan + Solscan | 免费 |
| 活跃服务商排行 | 周度 | payTo 地址聚合 | 免费 |
| 单笔金额分布 | 周度 | 链上原始数据 | 免费 |
| 累计交易笔数/量 | 实时 | 累计计算 | 免费 |

---

#### M5.3 协议对比（静态，季度更新）

四大协议**分层互补**，不是竞争关系：

| 协议 | 发起方 | 层级 | 结算层 | 核心场景 | 上线状态 |
|-----|-------|------|-------|---------|---------|
| **x402** | Coinbase + Cloudflare | 执行层 | 链上 USDC | API/开发者/crypto-native | 生产可用（V2） |
| **AP2** | Google Cloud | 授权层 | 支付无关 | 企业 agent 授权 | 规范阶段（60+ 合作方） |
| **ACP/SPT** | Stripe + OpenAI | 商务层 | 法币优先 | 消费者 agent 购物 | 已上线（ChatGPT） |
| **MPP** | Tempo (Stripe+Paradigm) | 基础链 | 法币+链上 | 高频 M2M 微支付 | 主网 2026-03-18 上线 |

**关键融合信号**：Google AP2 已将 x402 纳为链上子协议（A2A x402 Extension），Coinbase + MetaMask + Ethereum Foundation 联合开发。

---

#### M5.4 基础设施参考（静态）

**Facilitator（结算验证方）**：

| 名称 | 网络 | 特点 | 费用 |
|-----|------|------|------|
| CDP Facilitator | Base / Polygon / Solana | 默认推荐，KYT/OFAC 合规 | 免费 |
| PayAI | Base / Solana / Avalanche | 多链 | 收费 |
| Primer | Base / EVM | V1 & V2，全 ERC-20 支持 | 收费 |
| OpenFacilitator | Base | 开源，可自托管 | 免费 |
| Mogami | Base / EVM | 开发者友好，Java SDK | 免费 |

**CDP Facilitator 端点**：`https://api.cdp.coinbase.com/platform/v2/x402`

---

#### M5.5 OpenClaw 链上支付 Skills 追踪

| Skill | 发布方 | 技术 | 状态 |
|-------|-------|------|------|
| CoinFello + MetaMask | CoinFello | ERC-4337 + ERC-7710 委托 | 已上线 |
| BankrBot Skills | BankrBot | Polymarket / DeFi / 交易 | 已上线 |
| x402 支付 Skill（社区）| Community | HTTP 402 自动支付，USDC on Base | 开发中 |

**追踪方式**：GitHub `openclaw/skills` 仓库扫描，统计含 `x402` 字段的 `SKILL.md` 数量变化。

---

#### M5.6 生态增长趋势（多线图）

- 类型：多线折线图，统一时间轴，近12个月（月度）
- 每条线标注置信度（✅ 链上确认 / ⚠️ 估算 / 📋 定性）
- 维度：
  - x402 日交易量（Base + Solana）
  - ClawHub 付费 Skills 数
  - OpenClaw GitHub Stars（周增量）
  - Autonolas 注册 Agent 数

---

#### M5.7 最新进展新闻流

- 内容：协议发布、生态动态、机构采用公告
- 关键词过滤：`x402` / `AP2` / `ACP` / `agent payment` / `OpenClaw` / `agentkit`
- 数据源：与 M1.5 同一 RSS 新闻流，按 `ai-payments` 标签过滤
- 展示格式：日期 + 标题 + tags + 来源
- 接入方式：后续与 M1.5 Claude API 新闻流统一接入
- 当前状态：占位符，格式已定义，数据接入中

---

## 二补：规范定义（测试代码依赖）

### R1. 计算逻辑精确定义

#### 利息收入估算模型
```
估算利息收入（日）= USDC储备规模（USD） × (美联储3个月期国债利率 / 365)
估算利息收入（季）= Σ 该季度每日估算值
利率来源：美联储 H.15 数据（FRED API，免费，代码：DTB3）
精度：四舍五入到美元整数
展示：估算值（虚线）+ 实际财报值（实线）双线对比
```

#### 市占率计算
```
历史市占率（M1.2 图表用）：
  数据源：DefiLlama /stablecoincharts/all?stablecoin={id}
  每日各币种 circulating.peggedUSD → 占所有追踪币种之和的百分比
  注意：date 字段为 Unix 时间戳字符串，需 parseInt 后转换

实时市占率（M1.1 指标卡用）：
  分母：CoinGecko /coins/markets 返回的 market_cap 字段求和
  回退方案：若 API 超时，用上次缓存的总量

显示精度：两位小数，如 68.43%
```

#### 脱锚预警规则
```
触发条件：价格连续 15 分钟偏离 $1.000 超过 ±0.5%
数据源：CoinGecko 价格（60s 粒度）
检测逻辑：滑动窗口，连续 15 个数据点均在阈值外 → 触发
恢复条件：连续 5 分钟回归 ±0.2% 范围内 → 解除
预警级别：
  偏离 0.5%-1%  → 🟡 关注
  偏离 1%-3%    → 🔴 高风险
  偏离 >3%      → 🔴🔴 严重（历史极端事件级别）
```

#### Mint/Burn 时区和跨天规则
```
所有时间戳：UTC
跨天交易归属：以交易上链时间（block_timestamp UTC）为准，归属到该 UTC 日期
数据来源时间戳：直接使用 DefiLlama 返回的 Unix 时间戳，不做时区转换
展示时：后台存 UTC，前端根据用户浏览器时区展示（标注"UTC+X"）
```

#### 数字格式化规则
```typescript
function formatUSD(value: number): string {
  if (value >= 1_000_000_000_000) return `${(value/1e12).toFixed(2)}T`
  if (value >= 1_000_000_000)     return `${(value/1e9).toFixed(2)}B`
  if (value >= 1_000_000)         return `${(value/1e6).toFixed(2)}M`
  if (value >= 1_000)             return `${(value/1e3).toFixed(1)}K`
  return `${value.toFixed(2)}`
}
// Y轴自动单位：取数据集最大值，按上述规则选单位，全轴统一
// Tooltip：始终显示完整数值，如 $68,432,100,000
// 负数：-$1.2B（负号在$前）
```

#### x402 数据追踪机制（重要修正）

> x402 **没有单一的 Facilitator 合约**。CDP Facilitator 是托管的 HTTP API 服务（`https://api.cdp.coinbase.com/platform/v2/x402`），结算时广播 EIP-3009 TransferWithAuthorization，最终在链上体现为普通的 USDC ERC-20 Transfer 事件。

因此追踪方案调整为：

```
追踪方式 A（服务商地址注册表，主要方式）：
  维护已知 x402 服务商的 payTo 钱包地址列表
  → 监听 USDC 合约 Transfer 事件中 to = 已知服务商地址
  → 聚合统计交易量和笔数

追踪方式 B（x402scan API，补充方式）：
  x402scan.com 提供生态浏览器数据
  → 直接调用其公开 API 获取汇总数据
  → 作为交叉验证和补充

USDC on Base 合约地址：0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
监听事件：Transfer(address indexed from, address indexed to, uint256 value)
精度：6位小数（USDC标准）
```

**已知 x402 服务商地址（初始种子列表，持续补充）**：

| 服务商 | payTo 地址 | 链 | 来源 |
|-------|-----------|---|------|
| Alchemy Agentic Gateway | 待查（从 Basescan 验证）| Base | 官方文档 |
| CoinGecko x402 | 待查 | Base+Solana | 官方公告 |
| Firecrawl | 待查 | Base | GitHub issue #2212 |
| claw402.ai | 待查 | Base | ClawHub SKILL.md |
| Cloudflare pay-per-crawl | 待查 | Base | 官方博客 |

> 📌 **行动项**：上线前需从各服务商官方文档或链上验证获取真实 payTo 地址。未识别地址标记为"Unknown"，后续补充。

### R2. 异常处理行为规范

| 场景 | 行为 |
|-----|------|
| 外部 API 超时（>5s） | 返回上次缓存数据，UI 不显示 error |
| 外部 API 返回空数组 | 视为错误，展示 error state |
| 缓存过期 + API 失败 | 展示过期数据 + 黄色 warning 条："数据可能不是最新，更新于 X 分钟前" |
| 数据延迟标注 | 参考 DefiLlama 惯例：在数据源标注下方显示 "Last updated: X min ago" |
| 连续失败 5 次 | 写入 error log，触发内部告警（Slack/email），前端降级到静态提示 |
| Claude API 返回格式异常 | fallback：仅存原始标题，跳过摘要，分类标记为 `other` |

### R3. 新闻处理规范（简化方案）

```
去重逻辑：
  1. URL 归一化后完全匹配 → 跳过
  2. 标题 Jaccard 相似度 > 0.8（分词后）→ 跳过，保留最早入库的

标签分类（关键词匹配，可多标签）：
  usdt:        ['tether', 'usdt', '泰达']
  usdc:        ['circle', 'usdc', 'eurc']
  ai-payments: ['x402', 'agent', 'agentkit', 'openclaw', 'superfluid', 'sablier', 'ai payment']
  regulation:  ['sec', 'cftc', 'mica', 'genius act', 'ban', 'lawsuit', 'enforcement', '监管', '合规']
  other:       默认（无上述关键词命中）

严重等级（关键词触发）：
  high:     ['depeg', 'hack', 'ban', 'freeze', 'lawsuit', 'crash', '脱锚', '冻结', '被黑']
  positive: ['launch', 'partnership', 'approved', 'ipo', 'milestone', '上线', '合作', '获批']
  medium:   ['regulation', 'audit', 'report', 'update', '监管', '审计', '报告']
  low:      默认

Claude API Prompt 模板：
  System: "你是加密货币新闻编辑，用中文输出，仅输出JSON，不要markdown"
  User:   "新闻标题：{title}\n正文前300字：{content}\n
           输出格式：{\"summary\":\"50字以内摘要\",\"tags\":[],\"severity\":\"\"}"
```

### R4. UI 交互行为规范

| 场景 | 规则 |
|-----|------|
| 时间粒度切换 | 保留当前滚动位置；数据无过渡动画，直接替换 |
| Tooltip 字段 | 日期（YYYY-MM-DD）、指标名、数值（完整数字）、环比变化% |
| 多点重叠 | 展示最近时间点数据，tooltip 列出所有重叠点 |
| 移动端替代交互 | 点击图表区域展示该数据点 tooltip（fixed 定位于屏幕底部） |
| Y 轴单位 | 自动选择，见 R1 格式化规则，全轴统一单位 |
| 置信度 ⚠️ 点击 | 展示 popover："此数据为估算值，基于 [方法说明]，可能与实际值有偏差" |
| 数据加载中 | 骨架屏（灰色占位块），不显示 spinner |
| 首次加载超 3s | 显示进度提示："正在加载链上数据…" |

### R5. Circle 财务数据录入规范

```
数据来源优先级：
  1. SEC EDGAR（上市后 10-Q/10-K，季度/年度，免费）
     EDGAR API：https://data.sec.gov/api/xbrl/companyfacts/CIK{N}.json
  2. Circle 官网储备报告（月度，PDF 解析）
  3. Google Finance / Yahoo Finance（补充验证）

字段录入规范：
  金额单位：USD，精确到千元（1000）
  期间标记：如 "2025-Q1"，"2025-FY"
  估算字段：interest_income_estimated（系统自动计算）
           interest_income_actual（人工录入财报值）
  修改记录：每次更新留 updated_by + updated_at + change_note

利率数据来源：
  FRED API（免费）：series_id = "DTB3"（3个月期国债二级市场利率）
  URL：https://api.stlouisfed.org/fred/series/observations?series_id=DTB3
```

---

## 三、API 成本策略

### 免费 API（MVP 阶段全部使用）

| API | 用途 | 限制 |
|-----|------|------|
| CoinGecko Free | 价格、市值、历史 | 30次/分钟 |
| DefiLlama Stablecoins | 链上分布、TVL、Mint/Burn | 无限制 |
| The Graph（Hosted） | CCTP、Superfluid、Sablier 子图 | 有限额 |
| Etherscan API（免费版） | ETH链交易、地址、标签 | 2000次/天 |
| Tronscan API | Tron链USDT数据 | 免费 |
| Basescan API | Base链Agent钱包 | 免费 |
| SEC EDGAR API | Circle 财报 | 免费 |
| RSS Feeds | 新闻源 | 免费 |

### 💰 付费 API 标注（MVP 阶段暂不采购）

| API | 月费 | 解锁功能 | 替代方案 |
|-----|------|---------|---------|
| Dune Analytics Plus | $349 | 自定义链上SQL、实时流向分析 | 免费版（有限额）+ Etherscan |
| CryptoQuant | $299 | 交易所净流量精准数据 | 已知热钱包地址自算 |
| Etherscan Pro | $49 | 无限 API 调用 | 免费版2000次/天 + 缓存策略 |
| Helius（Solana） | $99 | Solana 链实时数据 | Solscan 免费 API |
| **合计** | **~$800/月** | 完整版所需 | — |

### Claude API 用量控制策略
- 新闻摘要：批量处理（每30分钟一批，每次~20条）
- 输入：标题+正文前200字；输出：摘要50字+分类标签
- 估算成本：~$10-30/月（取决于新闻量）

---

## 四、技术架构

### 系统架构

```
前端层
  Next.js 14（App Router）+ TypeScript
  Chart.js（图表）+ D3.js（Sankey/流向）
  TailwindCSS
        ↓
BFF / API 层（数据聚合 + 缓存 + 鉴权）
  Node.js + tRPC / REST
        ↓
┌──────────┬──────────┬──────────┬──────────┐
│链上数据   │市场数据   │财务数据   │新闻/事件  │
│DeFiLlama │CoinGecko │SEC EDGAR │RSS+Claude│
│The Graph │          │人工录入  │          │
│Etherscan │          │          │          │
└──────────┴──────────┴──────────┴──────────┘
        ↓
存储层
  PostgreSQL + TimescaleDB（时序）
  Redis（缓存）
```

### 数据刷新策略
| 数据类型 | 刷新频率 | 缓存 |
|---------|---------|------|
| 价格/市值 | 60秒 | 55秒 |
| 链上分布 | 5分钟 | 4分钟 |
| Mint/Burn 净流量 | 1小时（日度数据） | 1小时 |
| CCTP 跨链流量 | 15分钟 | 14分钟 |
| 财务数据 | 手动触发（季报后） | 24小时 |
| 新闻流 | 30分钟批处理 | 25分钟 |
| Agent 链上数据 | 1小时 | 1小时 |

### 页面路由
```
/                 宏观全景（M1）
/usdc             USDC / Circle（M3）
/ai-payments      AI 支付生态（M5）
/flows            流向分析（M4，Phase 2）
/usdt             USDT 深度（M2，Phase 2）
/api/...          内部 API 路由
```

---

## 五、数据模型（核心表）

```sql
-- 稳定币市场数据
stablecoin_market_caps (
  id, symbol, market_cap_usd, circulating_supply,
  price_usd, recorded_at TIMESTAMPTZ
)

-- 各链分布
chain_distributions (
  id, symbol, chain_name, supply_usd,
  pct_of_total, recorded_at TIMESTAMPTZ
)

-- Mint/Burn 净流量（日度）
mint_burn_flows (
  id, symbol, chain_name,
  minted_usd, burned_usd, net_flow_usd,
  date DATE
)

-- Circle 财务（季度）
circle_financials (
  id, period_label, period_type ENUM(Q/Y),
  revenue_usd, interest_income_usd,
  service_fee_usd, net_income_usd,
  net_margin_pct, reserve_size_usd,
  usdc_supply_avg_usd, report_date DATE
)

-- CCTP 跨链流量
cctp_flows (
  id, from_chain, to_chain,
  volume_usd, tx_count, avg_amount_usd,
  recorded_date DATE
)

-- Agent 支付指标
ai_payment_metrics (
  id, protocol_name, category,
  ENUM(agent_wallet/streaming/x402/corridor),
  metric_name, metric_value,
  confidence ENUM(confirmed/estimated),
  recorded_at TIMESTAMPTZ
)

-- 新闻事件
news_events (
  id, title, summary_ai, source_url,
  tags TEXT[],  -- ['usdc','regulation']
  severity ENUM(high/medium/low/positive),
  published_at TIMESTAMPTZ
)

-- 地址标签库（自建）
address_labels (
  id, address, chain, label_name,
  category ENUM(ceX/defi/bridge/payment/whale/agent),
  source, confidence, updated_at
)
```

---

## 六、平台独特价值总结

| 内容模块 | 性质 | 独特性说明 |
|---------|------|----------|
| 市值/分布 | 聚合 | DefiLlama/CoinGecko 已有，我们做更好的呈现 |
| Circle 财务可视化 | **半独特** | 数据公开但无人做成可互动季度趋势分析 |
| 利息收入估算模型 | **独特挖掘** | 储备×利率的计算方法，可与实际财报对比 |
| CCTP + CPN 产品追踪 | **半独特** | 从产品视角理解 Circle 收入结构 |
| 用途分类流向分析 | **独特挖掘** | 自建地址标签库，识别增量背后的真实用途 |
| AI 支付生态追踪 | **独特挖掘** | 市面几乎无系统性数据产品，先发优势 |
| 新闻流+AI分类 | 半独特 | AI 处理是增值，按模块标签过滤是体验差异化 |

---

## 七、开放问题

1. **用户账号系统**：MVP 是否需要登录？（影响预警功能）建议 MVP 无登录，Phase 2 加入。
2. **Circle 财务数据录入**：季报人工录入，是否需要 PDF 自动解析工具？
3. **Dune 免费版限制**：免费版每月查询额度有限，M4 流向分析在免费版下可能受限，需测试。
4. **移动端**：优先 PC，响应式适配作为 Phase 2。
5. **地址标签库冷启动**：初期标签覆盖率低（未识别地址可能占30-50%），需在 UI 上明确标注。

---

*文档版本：v1.2 | 下一步：进入测试设计阶段*
