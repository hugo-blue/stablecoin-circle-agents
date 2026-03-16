# Circle 产品体系深度研究报告

> 日期：2026-03-16 | 版本：v1.0 | 用途：StablePulse M3.3 模块设计参考

---

## 一、Circle 公司概况（FY2025）

| 指标 | 数值 |
|------|------|
| 股票代码 | NYSE: CRCL（2025年6月5日 IPO，$31/股）|
| 全年收入 | $2.7B（+64% YoY）|
| Q4 2025 收入 | $770M（+77% YoY）|
| 收入构成 | 储备利息 ~96%，平台服务 ~4%（$110M）|
| Adjusted EBITDA 利润率 | 54% |
| USDC 流通量（年末）| $75.3B（+72% YoY）|
| Q4 链上 USDC 交易量 | $11.9T（+247% YoY）|
| 有意义钱包数 | 6.8M（+59% YoY）|
| USDC 累计链上交易量 | $50T+ |

**核心商业模式**：USDC 储备投资于短期美国国债（~42%）、隔夜回购协议（~42%）和银行存款（~16%），年化收益约 4%。$60B+ 流通量 × 4% ≈ $2.6B 年利息收入。但其中约 63% 作为渠道分成支付给合作伙伴（主要是 Coinbase）。

---

## 二、产品体系架构

Circle 的产品可以理解为一个垂直整合的分层体系：

```
┌─────────────────────────────────────────────────────────────┐
│  应用/网络层                                                  │
│  CPN (机构跨境支付网络) │ StableFX (链上外汇)                   │
├─────────────────────────────────────────────────────────────┤
│  支付原语层                                                   │
│  Nanopayments (微支付) │ x402 (HTTP原生支付, Coinbase合作)      │
├─────────────────────────────────────────────────────────────┤
│  跨链基础设施                                                  │
│  CCTP v2 (跨链转账) │ Gateway (链抽象/统一余额)                  │
├─────────────────────────────────────────────────────────────┤
│  资产层                                                       │
│  USDC │ EURC │ xReserve (合作伙伴稳定币) │ USYC (货币基金代币化) │
├─────────────────────────────────────────────────────────────┤
│  开发者/铸造层                                                 │
│  Circle Mint │ Programmable Wallets │ Gas Station │ Arc (L1)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、核心产品详解

### 3.1 CCTP（Cross-Chain Transfer Protocol）— 跨链管道

**定位**：USDC 在不同区块链之间的原生转移协议。不使用"包装"代币，而是在源链销毁、目标链重新铸造。

**当前状态**：
- V2 版本 2025年3月上线，引入秒级结算（Fast Transfers）和 Hooks（可组合操作）
- 覆盖 17 条链
- 累计交易量 $126B，600万+ 跨链转账
- Q4 2025 单季 $41.3B（YoY 3.7x 增长）
- 占所有桥接 USDC 的 50%（从2024年Q4的25%翻倍）

**技术架构**：
```
源链（如 Ethereum）            目标链（如 Base）
     │                              │
     │  1. 用户调用                   │
     │  TokenMessenger.depositForBurn │
     │  → USDC 被销毁                │
     │                              │
     │  2. Circle Attestation 服务   │
     │  签发跨链证明                  │
     │                              │
     │  3. Relayer 提交证明          │
     │  → MessageTransmitter         │
     │  .receiveMessage              │
     │  → USDC 在目标链重新铸造       │
```

**合约地址（V2，所有 EVM 链统一地址）**：

| 合约 | 地址 |
|------|------|
| TokenMessengerV2 | `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d` |
| MessageTransmitterV2 | `0x81D40F21F12A8F0E3252Bccb954D722d4c464B64` |
| TokenMinterV2 | `0xfd78EE919681417d192449715b2594ab58f5D002` |

Solana CCTP V2：
- MessageTransmitterV2: `CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC`
- TokenMessengerMinterV2: `CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe`

**收入模式**：CCTP 本身不直接收费（或收取极小费用）。其价值在于增加 USDC 跨链流动性和粘性，间接推高 USDC 流通量 → 更多储备利息收入。CCTP 交易费被归入"其他收入/交易收入"（Q4 2025: $12.2M，包含 CCTP 费用、快速赎回费等）。

**数据可追踪性**：✅ 完全链上可追踪。burn/mint 事件、MessageSent/MessageReceived 事件均可查询。

---

### 3.2 CPN（Circle Payments Network）— 机构跨境支付网络

**定位**：连接全球金融机构（银行、支付商、数字钱包）的实时跨境结算网络，使用 USDC/EURC 作为结算媒介。类比：**稳定币版本的 SWIFT**。

**当前状态**：
- 2025年4月宣布，5月上线
- 55 家机构已入网，74 家审核中
- 年化交易量 $5.7B（截至2026年2月）
- 结算链：Ethereum、Polygon、Solana（未来迁移到 Arc）

**完整用户流程（新加坡银行→巴西银行 $10万汇款）**：

```
阶段1：报价（链下）
  新加坡银行（OFI）→ CPN API 发起 RFQ："100K USD → BRL"
  CPN 广播给巴西的 BFI 们 → 多家返回报价（汇率+费用+时效）
  OFI 选择最优报价

阶段2：合规（链下）
  OFI 收集并加密 Travel Rule 数据（发送方/接收方 KYC）
  通过 CPN 转发给选中的 BFI
  BFI 解密，做 AML/KYC 审核 → 通过

阶段3：链上结算
  OFI 签名 EIP-712 授权
  CPN 通过 Permit2 合约 → PaymentSettlement 合约
  USDC 从 OFI 钱包 → BFI 钱包（链上转账）
  Circle Relayer 代付 Gas 费

阶段4：最后一公里（链下）
  BFI 收到 USDC → 兑换为 BRL → 打入收款人巴西银行账户
  终端用户全程看不到 USDC
```

**每个环节的价值捕获**：

| 环节 | Circle 的收入方式 |
|------|-----------------|
| 网络匹配 | CPN 网络费（按国家分级 basis points）|
| OFI 入金铸造 USDC | Circle Mint 铸造费 |
| USDC 在途期间 | 储备利息（间接）|
| 链上结算 Gas | 目前 Circle 代付，未来在 Arc 上收取 |
| BFI 赎回出金 | Circle Mint 赎回费 |

**合约地址**：
- 使用 Uniswap Permit2：`0x000000000022D473030F116dDEE9F6B43aC78BA3`
- PaymentSettlement 合约地址**未公开**

**数据可追踪性**：⚠️ 部分可追踪。链上结算腿是标准 USDC Transfer，但因 PaymentSettlement 合约地址未公开，难以从普通 USDC 转账中区分 CPN 流量。

**已确认的参与机构**：
- 实际处理交易中：Alfred Pay、Tazapay、RedotPay、Conduit
- 设计合作伙伴：Banco Santander、Deutsche Bank、Societe Generale、Standard Chartered
- 入网机构：Flutterwave、Coins.ph、Zodia Markets、BCB Group

---

### 3.3 Arc — Circle 自有 L1 公链

**定位**：面向金融机构的 EVM 兼容 L1 公链，"互联网的经济操作系统"。**不与以太坊/Base 竞争通用计算**，而是专注稳定币金融场景。

**与其他链的关键差异**：

| 特性 | Ethereum | Base | Arc |
|------|----------|------|-----|
| 定位 | 通用计算 | 通用 L2 | 稳定币金融 |
| Gas 代币 | ETH（波动）| ETH（波动）| **USDC（稳定）** |
| 终态性 | ~12分钟 | ~2秒 | **亚秒级确定性** |
| 验证者 | 无许可 | Coinbase 排序器 | **许可制（审核机构）** |
| 隐私 | 全公开 | 全公开 | **可选屏蔽余额** |
| EVM 兼容 | 是 | 是 | 是 |

**核心创新**：
1. **法币计价 Gas 费**：USDC 是原生 Gas 代币，交易费以美元定价（~$0.00001/tx），无需持有波动性加密资产
2. **Malachite 共识**：基于 Tendermint 的 BFT 共识引擎（Circle 收购自 Informal Systems），亚秒级确定性终态，零重组风险
3. **许可制验证者**：只有审核通过的机构可以运行节点。批评者认为这更像"联盟链"，但 Circle 认为这是机构合规的必要条件
4. **内置 FX 引擎**：原生支持机构级外汇交易

**当前状态**：
- 测试网 2025年10月上线
- 1.66 亿+ 交易，~230万日交易，0.5秒平均终态
- 100+ 公司参与测试
- 设计合作方：BlackRock、Deutsche Bank、Goldman Sachs、HSBC、Visa、Coinbase、Kraken
- 区块浏览器：https://testnet.arcscan.app/
- 主网预计 2026年（具体月份未公布）

**与 CPN 的关系**：Arc 是 CPN 的**终局基础设施**。当前 CPN 在 Ethereum/Polygon/Solana 上结算，未来将迁移到 Arc，届时 Circle 不再"租用"其他链，而是在自有基础设施上运行支付网络。

**收入模式**：每笔交易的 Gas 费（USDC 计价）+ 生态系统价值捕获。目前 $0 收入（测试网）。

**数据可追踪性**：✅ 测试网数据可通过区块浏览器查看。主网上线后完全可追踪。

---

### 3.4 Nanopayments — 微支付原语

**定位**：面向 AI Agent 经济的无 Gas 微支付服务，支持低至 $0.000001 的 USDC 支付。

**核心问题**：区块链上每笔交易都有 Gas 成本，使得微支付（如 AI Agent 调用一次 API 花 $0.001）在经济上不可行。Nanopayments 通过链下聚合解决这个问题。

**不是独立链**，是运行在现有链上的应用层服务。

**技术架构**：
```
1. Agent 签名 EIP-3009 授权（链下，无 Gas）
   → transferWithAuthorization 签名消息

2. Circle 后端验证签名 + 更新内部账本（链下，即时）
   → 商户立刻收到确认，可以提供服务

3. 累积 N 笔后，Circle 批量结算上链（链上）
   → 一笔链上交易结算成千上万笔微支付
   → Circle 承担 Gas 费用
```

**安全性**：签名密钥通过 AWS Nitro Enclaves（KMS）保护，Circle 员工也无法访问。

**当前状态**：
- 2026年3月3日上测试网
- 支持 12 条链测试网：Arbitrum、Arc、Avalanche、Base、Ethereum、HyperEVM、Optimism、Polygon PoS、Sei、Sonic、Unichain、World Chain
- 尚未上主网

**合约地址（复用 Gateway 基础设施）**：
- GatewayWallet (主网): `0x77777777Dcc4d5A8B6E418Fd04D8997ef11000eE`
- GatewayMinter (主网): `0x2222222d7164433c4C09B0b0D809a9b52C04C205`

**与 x402 的关系**：Nanopayments 遵循 x402 支付标准，x402 定义了 HTTP 402 状态码 + 支付的交互协议，Nanopayments 提供底层的微支付执行能力。两者互补。

**收入模式**：批量结算手续费（具体费率未公开）。战略价值在于让 USDC 成为 AI Agent 经济的默认支付货币。

**数据可追踪性**：⚠️ 有限。链下微支付不可追踪，链上批量结算可通过 Gateway 合约追踪。

---

### 3.5 Circle Mint — 机构铸造/赎回服务

**定位**：机构级的 USDC/EURC 铸造和赎回 API 服务。**不是智能合约，是 API 服务**。

**工作方式**：
- 铸造：机构存入法币 → Circle Mint 通过 Master Minter 授权的 minter 地址调用 USDC 合约的 `mint()` 函数
- 赎回：机构提交 USDC → Circle 调用 `burn()` → 返还法币

**链上足迹**：
- USDC Master Minter (Ethereum): `0xe982615d461dd5cd06575bbea87624fda4e3de17`
- 每条链上的 USDC 合约均有 `masterMinter` 角色控制授权铸造者白名单

**2025年Q4 数据**：铸造 + 赎回量 $163B（YoY +129%）

**收入模式**：快速赎回费 + 电汇费。SOC 1 Type 2 认证（2026年3月）。

**数据可追踪性**：✅ USDC 合约的 Mint/Burn 事件完全可追踪（即 DefiLlama 上看到的 USDC 供应量变化）。

---

### 3.6 其他产品简述

| 产品 | 说明 | 状态 | 商业意义 |
|------|------|------|---------|
| **Gateway** | 链抽象层，11条链统一 USDC 余额 | 已上线 | CPN/Nanopayments 的底层依赖 |
| **EURC** | MiCA 合规欧元稳定币 | 市值 €70M→€300M（2025年4.3x）| 欧洲市场关键，CPN 多币种基础 |
| **StableFX** | 链上 FX 引擎，机构外汇交易 | Arc 测试网 | 瞄准 $10T+/天全球外汇市场 |
| **xReserve** | 合作链发行 USDC 支持的稳定币 | 早期 | 扩展 USDC 到未直接部署的链 |
| **USYC** | 代币化货币市场基金（与 Hashnote 合作）| $1.6B AUM | 全球第二大代币化 MMF |
| **Programmable Wallets** | 开发者钱包即服务 | 已上线 | "其他收入"增长贡献 |
| **Build with AI** | AI 代码生成 + MCP Server | 2025年底上线 | 降低开发者接入门槛 |

---

## 四、CCTP vs CPN vs Nanopayments 关系总结

三者是**互补的不同层级**，不是竞争关系：

| 维度 | CCTP | CPN | Nanopayments |
|------|------|-----|-------------|
| **层级** | 跨链管道 | 机构支付网络 | 微支付原语 |
| **类比** | TCP/IP | SWIFT | Stripe 的每次 API 计费 |
| **用户** | 开发者/DeFi协议 | 银行/支付机构 | AI Agent/开发者 |
| **金额** | 任意 | 大额（$10K+）| 极小额（$0.000001+）|
| **结算** | 链上实时 | 链上实时 | 链下即时 + 链上批量 |
| **成熟度** | ✅ 生产环境 | ⚠️ 早期生产 | 🔬 测试网 |
| **链上数据** | 完全公开 | 部分公开 | 有限 |

**统一逻辑**：
- CCTP 解决"USDC 怎么在链之间搬运"
- CPN 解决"银行怎么用 USDC 做跨境结算"（底层可用 CCTP 跨链）
- Nanopayments 解决"Agent 怎么付亚分级的费用"
- Gateway 让以上所有产品的用户不用关心"在哪条链上"
- Arc 是终局：所有东西最终都收拢到 Circle 自有链上

---

## 五、价值捕获全景

### 收入来源分解（FY2025）

| 来源 | 金额 | 占比 | 说明 |
|------|------|------|------|
| 储备利息（总额）| ~$2.6B | — | 储备资产（国债+回购+存款）收益 |
| - 渠道分成（Coinbase等）| ~$1.6B | — | 其中 Coinbase 获大部分 |
| **储备利息（净留存）** | **~$1.0B** | **~37%** | Circle 实际留存的利息 |
| 平台服务收入 | $110M | ~4% | 含订阅/服务费 $24.7M/Q4 + 交易费 $12.2M/Q4 |
| **合计净收入** | **~$1.1B** | — | — |

### 各产品价值捕获方式

| 产品 | 直接收入 | 间接价值 |
|------|---------|---------|
| **USDC 发行** | 储备利息 ~$2.6B/yr（$1.0B 净留存）| 一切的基础 |
| **Circle Mint** | 铸造/赎回手续费 | 推动 USDC 流通量增长 |
| **CCTP** | 跨链交易费（归入交易收入） | 增加 USDC 跨链粘性 |
| **CPN** | 网络费（bps 抽成） | 推动机构采用 USDC |
| **Nanopayments** | 批量结算费（未公开）| 占领 AI Agent 支付赛道 |
| **Arc** | Gas 费（USDC 计价）| 垂直整合，不再租用其他链 |
| **EURC** | 储备利息（欧元资产）| 多币种支付网络 |
| **USYC** | 资产管理费 | 代币化金融资产 |

### 核心商业挑战

**利率依赖风险**：美联储每降息 100bps，Circle 年收入减少约 $4.4 亿。当前 95%+ 收入来自利息，所有"平台产品"（CPN、CCTP、Nanopayments等）合计仅 $110M。

**战略逻辑**：Circle 在和利率下降赛跑——需要在降息周期到来前，将交易费/网络费/平台服务收入做到足够大，以抵消利息收入下滑。

---

## 六、Coinbase 分成模型（关键成本结构）

| 维度 | 规则 |
|------|------|
| Coinbase 平台上持有的 USDC | Coinbase 获得 **100%** 储备利息 |
| 链下其他渠道的 USDC | Circle 与 Coinbase **50/50** 分成 |
| 2024年 Coinbase 分成总额 | **$908M**（占 Circle 总收入的 54%）|
| Coinbase 持有 USDC 占比 | 2022年 5% → 2025年 22%（逐年上升）|
| 渠道成本占收入比 | 2022年 37% → 2024年 60% → 2025年 ~62% |
| 协议续签周期 | 每 3 年，下次 **2026 年** |

这是 Circle 最大的成本压力：Coinbase 占比越高，Circle 留存越少。2026年协议续签是重要事件。

---

## 七、链上合约地址汇总

### USDC 合约地址

| 链 | 地址 |
|----|------|
| Ethereum | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| Base | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Arbitrum | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |
| Polygon PoS | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` |
| Solana | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| Avalanche | `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E` |
| OP Mainnet | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` |

### CCTP V2 合约（所有 EVM 链统一）

| 合约 | 地址 |
|------|------|
| TokenMessengerV2 | `0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d` |
| MessageTransmitterV2 | `0x81D40F21F12A8F0E3252Bccb954D722d4c464B64` |
| TokenMinterV2 | `0xfd78EE919681417d192449715b2594ab58f5D002` |

### CCTP V1 合约（主要链）

| 链 | TokenMessenger | MessageTransmitter |
|----|---------------|-------------------|
| Ethereum | `0xBd3fa81B58Ba92a82136038B25aDec7066af3155` | `0x0a992d191DEeC32aFe36203Ad87D7d289a738F81` |
| Base | `0x1682Ae6375C4E4A97e4B583BC394c861A46D8962` | `0xAD09780d193884d503182aD4588450C416D6F9D4` |
| Arbitrum | `0x19330d10D9Cc8751218eaf51E8885D058642E08A` | `0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca` |
| Polygon | `0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE` | `0xF3be9355363857F3e001be68856A2f96b4C39Ba9` |

### CPN 合约

| 合约 | 地址 | 备注 |
|------|------|------|
| Permit2（Uniswap） | `0x000000000022D473030F116dDEE9F6B43aC78BA3` | 授权框架 |
| PaymentSettlement | 未公开 | Circle 未在文档中公布 |

### Gateway / Nanopayments 合约

| 合约 | 主网地址 |
|------|---------|
| GatewayWallet | `0x77777777Dcc4d5A8B6E418Fd04D8997ef11000eE` |
| GatewayMinter | `0x2222222d7164433c4C09B0b0D809a9b52C04C205` |

### Circle Mint 链上足迹

| 角色 | Ethereum 地址 |
|------|--------------|
| Master Minter | `0xe982615d461dd5cd06575bbea87624fda4e3de17` |

---

## 八、数据可追踪性评估

| 产品 | 链上数据 | 可追踪程度 | 追踪方法 |
|------|---------|-----------|---------|
| **CCTP** | burn/mint 事件 | ✅ 完全可追踪 | MessageSent/Received 事件 |
| **CPN** | USDC Transfer | ⚠️ 部分可追踪 | Permit2 事件分析（PaymentSettlement地址未知）|
| **Arc** | 全部交易 | ✅ 测试网可追踪 | arcscan.app 区块浏览器 |
| **Nanopayments** | 批量结算 | ⚠️ 有限 | Gateway 合约事件（个体微支付链下不可见）|
| **Circle Mint** | Mint/Burn 事件 | ✅ 完全可追踪 | USDC 合约事件 |
| **EURC** | 供应量/转账 | ✅ 完全可追踪 | DefiLlama + 链上数据 |

---

## 九、产品分散性评估

### 产品数量对比

| 公司 | 稳定币相关产品数 | 策略 |
|------|----------------|------|
| **Circle** | ~13-15 个 | 全栈垂直整合 |
| **Tether** | ~5-7 个 | 稳定币 + Hadron 代币化 + 多元投资 |
| **PayPal** | ~2-3 个 | PYUSD 作为现有支付帝国的功能 |

### 评估

**看似分散，实际是垂直整合**：

```
USDC（根基）→ CCTP（搬运）→ Gateway（抽象）→ CPN/Nanopayments（应用）→ Arc（自有链）
```

每一层为上一层提供基础设施。Arc 是终局收拢点——如果成功，所有产品最终都在 Circle 自有链上运行，实现完全垂直整合。

**风险**：95% 收入仍是利息，所有"平台产品"合计仅贡献 4%。分析师对这一策略分歧很大（目标价从 $40 到 $280 不等）。

---

## 十、美国稳定币生态竞争格局（2026年3月）

### 市场概况
- 总稳定币市值约 $317B
- USDT $184B (~60%), USDC $78B (~25%), 合计控制 ~93%
- 2025年稳定币支付量 $9T (+87% YoY)
- USDC 调整后链上交易量首次超越 USDT（2019年以来首次）

### 各玩家详解

#### JPMorgan / Kinexys
- JPM Coin (JPMD): 机构存款代币，日处理 $2-3B，累计 $1.5T+
- 2025.11 部署到 Coinbase Base 链（首次公链部署）
- 与 USDC 关系：互补为主。JPM Coin 是闭环机构工具，USDC 是开放稳定币
- 四大银行联盟（JPM+BofA+Citi+Wells Fargo）讨论联合发行稳定币，Wells Fargo 注册 "WFUSD" 商标

#### Stripe / Bridge / Tempo
- 2025.02 以 $1.1B 收购 Bridge（史上最大加密收购）
- Bridge 提供稳定币编排基础设施，有自己的 USDB 稳定币
- 稳定币金融账户覆盖 101 个国家
- Tempo: 2025.09 与 Paradigm 联合推出的 L1 支付链，100K+ TPS，亚秒终态
- Tempo 合作方：Mastercard、UBS、Klarna（KlarnaUSD 首个银行稳定币）
- 与 Circle 关系：复杂——支持 USDC，但 Tempo+USDB 直接竞争 Circle 基础设施层

#### Visa
- 2025.12 在美国启动 USDC 结算（Solana 链），首批银行：Cross River Bank、Lead Bank
- 年化稳定币结算量 $3.5B+
- 与 Bridge 合作推出 100+ 国家稳定币 Visa 卡
- Circle Arc 设计合作方
- Onchain Analytics Dashboard（与 Allium 合建）：追踪 10 条链上稳定币数据
- 立场：网络中立，不绑定任何单一稳定币

#### Mastercard
- MTN（Multi-Token Network）同时支持 4 种稳定币：USDC、PYUSD、USDG、FIUSD
- 2025.08 扩展与 Circle 合作：EEMEA 区域 USDC/EURC 结算
- 85+ 加密合作伙伴计划
- 同时是 Stripe Tempo 早期合作方
- 2025年稳定币卡消费 $4.5B（+673% YoY）
- 立场：明确的多稳定币路线

#### PayPal / PYUSD
- 市值约 $3.9B（+680% YoY），第5大稳定币
- 2026.01 接入 YouTube 创作者经济（$100B 市场）
- 4亿 PayPal/Venmo 用户基础
- 4% 持有奖励（但 CLARITY Act 可能禁止支付稳定币发利息）
- Paxos 发行，已完成 OCC 信托牌照转换
- 与 Circle 关系：纯竞争，但规模差 20 倍

#### Coinbase
- USDC 利息分成：2024 获 $908M（Circle 总分发成本的 89.8%）
- Base 链是 USDC 在 L2 的主要阵地
- 2025.12 推出"定制稳定币即服务"（基于 USDC 的白标稳定币）
- 与 Google 合作将稳定币支付嵌入 AI Agent 协议
- 不会开发自己的稳定币——最大化 USDC 分发

#### Ripple / RLUSD
- 市值 $1.3B，第三大美国监管稳定币
- Standard Custody & Trust 发行（NYDFS 信托牌照）+ 获 OCC 联邦银行牌照初步批准
- 通过 Wormhole NTT 扩展到 L2（Optimism、Base、Ink、Unichain）
- 日本市场通过 SBI 分发
- 与 Circle 关系：直接竞争机构跨境支付，但规模差 60 倍

#### Tether
- USDT $184B，全球主导但美国被边缘化
- 储备仅约 85% 达到 GENIUS Act 要求的合规标准
- 2026.01 推出 USAT——合规版美国稳定币，Anchorage Digital 银行发行
- USAT 极早期（~$20M 市值），但如果 Tether 全球分发能力注入…
- CEO: Bo Hines（前白宫加密委员会执行董事）

#### 其他新兴玩家
- **Figure Markets / YLDS**: 首个 SEC 注册的生息稳定币，付 SOFR-0.50%（~3.85%），归类为公共债务证券
- **银行联盟**: JPM+BofA+Citi+WF 讨论通过 Zelle 基础设施联合发币
- **KlarnaUSD**: 首个银行发行的稳定币（在 Tempo 链上）

### GENIUS Act（稳定币法案）

2025年7月18日签署成法，预计 2026年11月生效。

关键条款：
- 创建联邦许可制度
- 要求 1:1 储备（现金、活期存款、<93天国债、隔夜回购、批准的货币基金）
- 禁止比特币/加密/长期债券做储备，禁止再质押
- 支付稳定币不是证券也不是商品

竞争影响：
| 对象 | 影响 |
|-----|------|
| Circle | 最大赢家。已完全合规，监管先发策略被验证 |
| Tether | 被迫创建 USAT，USDT 在美国面临存续问题 |
| 银行 | 获得明确联邦框架，可正式发行稳定币 |
| Coinbase | USDC 增长 = 更多分成收入 |
| PayPal | CLARITY Act 可能禁止支付稳定币发利息 |

### Visa / Mastercard 的中立性分析

Visa 和 Mastercard 不会绑定任何单一稳定币。它们是"网络中立"的：

- Visa: 同时与 Circle（USDC结算）和 Stripe/Bridge（稳定币卡）合作
- Mastercard: MTN 同时支持 USDC、PYUSD、USDG、FIUSD，同时也是 Tempo 合作方
- 它们的忠诚度 = 0。谁能带来最多交易量就接谁
- 银行是 Visa/MC 的股东和核心客户——如果银行联盟发币，可能被优先支持

### Circle 的护城河与风险

护城河：
1. 监管合规先发 — GENIUS Act 几乎为 Circle 量身定做
2. Visa + Mastercard 双卡网络结算
3. $78B 流通量 + $2.2T 链上交易量 — 流动性产生流动性
4. CPN 网络效应 — 55 家机构交易惯性
5. AI Agent 生态先占 — 98.6% 用 USDC

最大威胁：
1. Stripe/Tempo — 如果成功可直接绕过 Circle 基础设施层，Stripe 商户网络远超 Circle
2. 银行联盟 — JPM+BofA+Citi+WF 如果联合发币，机构端可能首选"自家银行币"
3. 利率下降 — 不是竞争威胁，但是生存威胁

---

*文档来源：Circle 官方文档、SEC 财报（S-1/10-Q/10-K）、开发者文档（developers.circle.com）、链上验证数据*
