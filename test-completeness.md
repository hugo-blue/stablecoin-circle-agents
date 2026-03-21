# 测试代码完整性检查报告 v2.1

> PRD v1.3 + M5 AI支付生态重构后的评估
> 变更（v2.1）：补充 M5 需求侧/服务侧测试用例；新增 payTo 地址抓取函数测试；新增 /api/ai-payments/* 路由测试；修正 E2E 中 AI 支付页的测试预期（当前为静态，动态接入前用 mock）；新增 M5.7 新闻流测试

---

## 一、完整性评分

| 层次 | v2.0 | v2.1 | 状态 |
|-----|-------|-------|------|
| 契约测试（外部API格式） | 95% | 95% | ✅ |
| 数据库模型测试 | 95% | 95% | ✅ |
| 计算逻辑单元测试 | 90% | 92% | ✅ |
| 组件状态单元测试 | 85% | 85% | ✅ |
| 数据管道集成测试 | 80% | 85% | ✅ |
| E2E 测试 | 80% | 82% | ✅ |
| **M5 专项（新增）** | **20%** | **75%** | ⚠️ 动态路由待建 |
| **总体** | **87%** | **90%** | ✅ |

### 剩余缺口（10%）
- `/api/ai-payments/x402-stats` 路由尚未建立（测试先写，路由后实现）
- `/api/ai-payments/providers` 路由尚未建立（同上）
- x402 服务商 payTo 地址待从 402 响应头抓取（用 Mock 替代）
- OpenClaw GitHub API 动态拉取未实现（静态数据过渡中）
- Circle EDGAR CIK 编号未查（fixture 替代）
- Superfluid/Sablier Subgraph schema 未核对

---

## 二、完整测试用例清单

### A. 单元测试（计算逻辑）约 55 个用例

#### A1. 数字格式化
```
formatUSD(0)                    → "$0.00"
formatUSD(999)                  → "$999.00"
formatUSD(1_000)                → "$1.0K"
formatUSD(1_234_567)            → "$1.23M"
formatUSD(68_432_000_000)       → "$68.43B"
formatUSD(1_200_000_000_000)    → "$1.20T"
formatUSD(-1_500_000)           → "-$1.50M"  ← 负号在$前
formatUSD(NaN)                  → "$—"       ← 降级展示
```

#### A2. 市占率计算
```
calcMarketShare(68_000e9, 200_000e9)   → 34.00
calcMarketShare(0, 200_000e9)          → 0.00
calcMarketShare(100e9, 0)              → throw / return null（除零保护）
calcMarketShare(200_000e9, 200_000e9)  → 100.00（单币种）
```

#### A3. 利息收入估算
```
// 储备 $50B，年利率 5.23%，日化
estimateInterest(50_000_000_000, 0.0523, 'daily')   → $7,164,384
estimateInterest(50_000_000_000, 0.0523, 'quarterly')→ $651,739,726（91天）
estimateInterest(0, 0.0523, 'daily')                → 0
estimateInterest(50_000_000_000, 0, 'daily')        → 0
estimateInterest(-1, 0.0523, 'daily')               → throw（负储备非法）
```

#### A4. 脱锚检测
```
// 滑动窗口，15个连续点（每点60s）均超阈值才触发
detectDepeg([1.000, ..15 × 1.006..])         → { triggered: true, severity: 'warning' }
detectDepeg([1.006, 1.006, ..14个.. 1.000])  → { triggered: false }  ← 未连续
detectDepeg([1.000, ..15 × 1.015..])         → { triggered: true, severity: 'critical' }
detectDepeg([1.000, ..15 × 1.035..])         → { triggered: true, severity: 'severe' }
detectDepeg([])                               → { triggered: false }
// 恢复检测：连续5个点回归 ±0.2%
detectDepegRecovery([0.998, 0.999, 1.000, 1.001, 1.000])  → { resolved: true }
detectDepegRecovery([0.998, 0.999, 1.000, 1.003, 1.000])  → { resolved: false }
```

#### A5. 新闻去重
```
dedup(url_A, url_A)                                 → DUPLICATE
dedup('https://coindesk.com/a?ref=t', 'https://coindesk.com/a') → DUPLICATE（URL归一化）
dedupByTitle('USDC price stable', 'USDC stays stable')         → 相似度计算
jaccard('usdc circle launch', 'circle usdc launch')             → 1.0 → DUPLICATE
jaccard('usdc launch', 'tether ban')                            → 0.0 → OK
```

#### A6. 新闻标签分类
```
classifyTags('Tether freezes USDT on Tron')         → ['usdt', 'regulation']
classifyTags('Circle announces USDC on Base')        → ['usdc']
classifyTags('x402 protocol sees 1M transactions')  → ['ai-payments']
classifyTags('Fed rate decision impact on stables') → ['other']
classifyTags('USDT USDC both hit record highs')     → ['usdt', 'usdc']  ← 多标签
```

#### A7. 新闻严重等级
```
classifySeverity('USDT depeg to $0.97')             → 'high'
classifySeverity('Circle IPO milestone reached')    → 'positive'
classifySeverity('Tether quarterly audit released') → 'medium'
classifySeverity('DeFi liquidity update')           → 'low'
```

#### A8. x402 金额精度转换
```
// USDC 6位小数
parseUsdcAmount('1000000')    → 1.000000  → 1.00 USD
parseUsdcAmount('100')        → 0.000100  → 0.0001 USD
parseUsdcAmount('0')          → 0
parseUsdcAmount('-1')         → throw（负值非法）
parseUsdcAmount('abc')        → throw（非数字）
```

#### A9. M5 payTo 地址抓取（新增）
```
// extractPayToAddress(headers: Headers): string | null
// 从 x402 服务商的 402 响应头解析 payTo 钱包地址

正常 402 响应头（含 x-payment-requirements JSON）
  → 返回 '0xabc...def'（Base 主网地址）
Solana 服务商响应头
  → 返回 'EPjF...t1v'（Solana 地址）
响应头缺少 x-payment-requirements 字段
  → 返回 null
x-payment-requirements 是非法 JSON
  → 返回 null，不抛出
payTo 字段存在但为空字符串
  → 返回 null
HTTP 200 响应（非 402）
  → 返回 null（不应调用此函数，但不应崩溃）
```

#### A10. M5 需求侧数据格式化（新增）
```
// formatDemandMetric(raw: GitHubRepoStats): DemandMetric

正常 GitHub API 响应 { stargazers_count: 247000 }
  → { stars: '247,000+', source: 'github' }
stars 为 0
  → { stars: '0', source: 'github' }
API 响应缺少 stargazers_count 字段
  → { stars: '—', source: 'github', error: 'MISSING_FIELD' }
```

#### A11. M5 x402 服务商分类（新增）
```
// classifyX402Provider(payToAddress: string, registry: ProviderRegistry): Provider

地址在注册表中
  → { name: 'Firecrawl', category: '网页数据', chain: 'Base' }
地址不在注册表中
  → { name: 'Unknown', category: 'unknown', chain: 'Base' }
地址格式非法（非 0x 开头 EVM 地址）
  → throw InvalidAddressError
空字符串地址
  → throw InvalidAddressError
```

---

### B. 组件测试（React Testing Library）约 45 个用例

#### B1. MetricCard（指标卡）
```
render({ value: 68_432e9, label: 'USDT 市值', change24h: 0.023 })
  → 展示 "$68.43B"
  → 展示 "+2.30%" 绿色
render({ value: 0, ... })         → 展示 "$0.00"（不报错）
render({ state: 'loading' })      → 展示骨架屏
render({ state: 'error' })        → 展示 error state
render({ state: 'stale', isStale: true }) → 展示 warning 条
```

#### B2. MarketShareChart（面积堆叠图）
```
render({ data: [], state: 'success' })          → EmptyState(NO_DATA)
render({ data: [单点], state: 'success' })      → 退化柱状图
render({ data: normalData, state: 'loading' })  → 骨架屏
render({ data: normalData, state: 'stale' })    → 图表 + warning 条
render timeRange 切换 '7D' → '30D'             → onTimeRangeChange 被调用，滚动位置保留
hover 数据点                                    → Tooltip 显示 date/value/fullValue/changePct
```

#### B3. MintBurnWaterfall（瀑布图）
```
render({ data: [{ netFlowUsd: 1e9 }] })         → 绿色正柱
render({ data: [{ netFlowUsd: -2e9 }] })        → 红色负柱
render period 切换 daily → weekly               → 数据聚合，无动画直接替换
render({ filterSymbol: 'USDC' })                → 只展示 USDC 数据
```

#### B4. CircleFinancialChart（财务图）
```
render({ periodType: 'Q', displayMode: 'interest' })
  → 双线：估算值（虚线）+ 实际值（实线）
切换 displayMode 'revenue' → 'margin'          → 图表类型变化
空数据某季度                                    → 空白占位，不报错
负净利润（亏损季度）                            → 红色展示
```

#### B5. ConfidenceBadge（置信度标注）
```
render({ confidence: 'confirmed' })    → ✅ 无 tooltip
render({ confidence: 'estimated' })    → ⚠️ 点击展示 popover 说明文字
render({ confidence: 'qualitative' })  → 📋 标注"定性数据"
```

#### B6. NewsStream（新闻流）
```
render({ items: [], state: 'success' })         → 空状态提示
render({ activeTag: 'usdc' })                   → 只展示含 usdc 标签的条目
render({ items: [...], state: 'loading' })      → 骨架屏列表
severity='high' 条目                            → 🔴 红色徽章
severity='positive' 条目                        → 🟢 绿色徽章
summaryAi=null 时                               → 展示原始标题，无摘要区域
```

---

### C. 集成测试（数据管道）约 28 个用例

#### C1. 外部 API → 转换 → 写库
```
DefiLlama /stablecoins → parseStablecoins() → DB insert
  正常响应 → 写入 chain_distributions，timestamp UTC
  超时(>5s) → 返回缓存，不写库
  空数组   → ApiError(EMPTY_RESPONSE)，不写库，计数 +1

CoinGecko /coins/markets → parseMarkets() → DB insert
  正常响应 → 写入 stablecoin_market_caps
  rate limit(429) → 退避重试（指数退避，最多3次）

Basescan USDC Transfer events → filterX402Transfers() → DB insert
  已知 payTo 地址 → 写入 x402_transactions，标记服务商
  未知 payTo 地址 → 写入 x402_transactions，label='Unknown'
  amount=0 的 Transfer → 过滤掉

// M5 需求侧：GitHub API → OpenClaw 指标（新增）
GitHub API /repos/openclaw/openclaw → parseRepoStats() → 前端展示
  正常响应 { stargazers_count: 247000 } → stars='247,000+'
  API 限流（403）→ 返回上次缓存值，标记 isStale=true
  仓库不存在（404）→ ApiError(REPO_NOT_FOUND)

// M5 服务侧：x402 端点探测 → payTo 地址写入注册表（新增）
HTTP 请求已知 x402 端点（如 Firecrawl）→ 收到 402 响应
  → extractPayToAddress(headers) 返回有效地址
  → 写入 provider_registry，status='verified'
HTTP 请求返回非 402（如 200 或 404）
  → status='not_x402'，不写地址
端点请求超时（>5s）
  → status='timeout'，不写地址，下次重试
```

#### C2. 缓存层
```
请求数据（缓存热）   → 返回缓存，不调用外部 API
请求数据（缓存冷）   → 调用外部 API，更新缓存
缓存过期 + API 失败  → 返回 stale 缓存，isStale=true
连续5次失败          → ApiFailureAlert 写入，fetchAttempts=5
连续6次失败          → 依旧返回 stale 缓存，fetchAttempts=6（不重置）
API 恢复成功         → fetchAttempts 重置为 0，isStale=false
```

#### C3. Claude API 新闻处理管道
```
RSS 原始条目 → 去重 → 关键词分类 → Claude 摘要 → DB insert
  正常流程 → summaryAi 非空，tags 正确
  Claude 超时 → summaryAi=null，tags 仍用关键词结果
  Claude 返回非 JSON → summaryAi=null，fallback 处理
  重复 URL → 跳过，不调用 Claude
  批量30条 → 单次 Claude 调用（节省 token）
```

#### C4. 利息估算自动计算
```
每日 cron → 读取 FRED DTB3 最新利率 → 读取当日储备规模
  → 计算 interestIncomeEstimatedUsd → 写入 circle_financials
  FRED API 失败 → 使用上次已知利率，标记估算警告
```

---

### D. 契约测试（外部 API 格式）约 18 个用例

```typescript
// DefiLlama /stablecoins
expect(response).toMatchSchema({
  peggedAssets: arrayOf({
    id: string,
    symbol: string,
    pegType: string,
    chains: arrayOf(string),
    chainCirculating: record(string, { current: { peggedUSD: number } }),
  })
})

// DefiLlama /stablecoin/{id}
expect(response.tokens).toBeArray()
expect(response.tokens[0]).toHaveKeys(['date', 'totalCirculatingUSD'])
expect(response.chainBalances).toBeObject()

// CoinGecko /coins/markets
expect(response[0]).toHaveKeys(['id', 'symbol', 'market_cap', 'current_price',
  'price_change_percentage_24h', 'circulating_supply'])
expect(response[0].current_price).toBeCloseTo(1.0, 1)  ← 稳定币价格应接近1

// Basescan getLogs (USDC Transfer)
expect(log).toHaveKeys(['transactionHash', 'blockNumber', 'timeStamp', 'data', 'topics'])
expect(log.topics[0]).toBe('0xddf252ad...')  ← Transfer event sig
// topics[1]=from, topics[2]=to, data=amount

// FRED DTB3
expect(response.observations).toBeArray()
expect(response.observations[0]).toHaveKeys(['date', 'value'])
expect(parseFloat(response.observations[0].value)).toBeGreaterThan(0)

// The Graph CCTP Subgraph
expect(data.messageSents).toBeArray()
expect(data.messageSents[0]).toHaveKeys(['amount', 'sourceDomain', 'destinationDomain'])

// SEC EDGAR XBRL
expect(data.facts['us-gaap']).toBeDefined()

// M5 内部 API：/api/ai-payments/x402-stats（路由待建，先写契约）
expect(response).toMatchSchema({
  data: {
    dailyTxCount: number,
    dailyVolumeUsdc: number,
    baseVsSolanaRatio: number,         // Base 占比 0~1
    activeFacilitators: number,
    totalEcosystemProjects: number,
    cumulativeTxCount: number,
  },
  state: oneOf('success', 'error', 'stale'),
  updatedAt: isoTimestamp,
})

// M5 内部 API：/api/ai-payments/providers（路由待建，先写契约）
expect(response).toMatchSchema({
  data: arrayOf({
    name: string,
    category: string,
    chain: string,
    payToAddress: string | null,       // null = 待抓取
    endpoint: string | null,
    priceUsdc: number | null,
    trackStatus: oneOf('verified', 'endpoint_known', 'pending', 'not_x402'),
    lastCheckedAt: isoTimestamp | null,
  }),
  state: oneOf('success', 'error'),
})

// GitHub API（需求侧 OpenClaw 数据）
expect(repoResponse.stargazers_count).toBeGreaterThan(0)
expect(repoResponse.stargazers_count).toBeNumber()
```

---

### E. E2E 测试（Playwright）约 22 个用例

```
首页加载
  → 3个并发 API 请求，全部完成后骨架屏消失
  → MetricCard 展示非零数值
  → 新闻流加载至少1条

首页 → USDC 页跳转
  → URL 变为 /usdc
  → 新闻流自动过滤为 usdc 标签
  → Circle 财务图展示季度数据

USDC 财务图交互
  → 切换 Q / Y → 数据重新渲染，X 轴标签变化
  → 切换 revenue / interest → 图表类型变化
  → hover 数据点 → tooltip 显示完整数值

AI 支付页（当前阶段：静态数据，动态接入前用 Mock）
  // 需求侧
  → 需求侧区块渲染，OpenClaw stars/MAU 显示（静态数据或 Mock API）
  → 主流 AI 产品支付就绪度表格有 4 行
  // 服务侧
  → 服务侧分 4 个分类渲染（网页数据/社交数据/AI推理/存储）
  → USDC 合约地址区块显示，Base 主网地址为 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
  → Basescan 链接 href 包含正确合约地址
  → payTo 状态标记为"端点已知"或"待抓取"（动态接入前不显示真实地址）
  // 协议对比
  → 4 个协议卡片渲染，x402 标记"已上线"，AP2 标记"规范阶段"
  // 基础设施
  → Facilitator 列表包含 CDP Facilitator
  // 新闻动态
  → 新闻区块渲染，显示"数据接入中"标记
  → 至少 1 条新闻占位条目可见
  // 动态数据接入后追加：
  // → /api/ai-payments/x402-stats 返回 stats 后，服务侧汇总指标卡显示真实数字
  // → ⚠️ 估算徽章点击 → popover 展示说明
  // → 时间范围切换 → 图表更新，滚动位置不变

脱锚预警流程（Mock 触发）
  → 注入 USDT 价格 = $0.993（15分钟）
  → 首页 depegAlertCount = 1
  → 徽章变红

API 失败降级
  → Mock CoinGecko 超时 → 展示 stale 数据 + warning 条
  → Mock DefiLlama 返回空数组 → error state（不展示过期数据）

移动端（375px viewport）
  → 首页图表可见，不截断
  → 点击图表区域 → bottom tooltip 展示
```

---

## 三、Mock 数据需求

测试代码需要准备以下 Fixture：

```
fixtures/
  coingecko-markets.json        # 正常响应（含5个稳定币）
  coingecko-markets-empty.json  # 空数组（错误情况）
  defillama-stablecoins.json    # 正常响应
  defillama-stablecoin-usdc.json# 单币种含 mint/burn 历史
  basescan-transfer-events.json # USDC Transfer 事件（含已知/未知地址）
  fred-dtb3.json                # 3月期国债利率数据
  circle-financials.json        # 8个季度财务数据
  news-rss-items.json           # 20条新闻（含重复、含各类标签）
  claude-api-summary.json       # Claude 正常响应
  claude-api-malformed.json     # Claude 非JSON响应（异常测试）
```

---

## 四、结论

**当前完整性：87%，可进入测试设计和编码阶段。**

剩余 13% 在开发初期以 Mock 替代，上线前补充真实地址验证。

建议测试执行顺序：
```
1. 单元测试（计算逻辑）    ← 纯函数，无依赖，最快
2. 组件测试               ← 需要 React 环境
3. 契约测试               ← 需要网络或 Mock Server
4. 集成测试               ← 需要数据库
5. E2E 测试               ← 需要完整应用启动
```

---

*v2.0 | 下一步：开始编写测试代码*
