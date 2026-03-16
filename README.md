# StablePulse

A real-time stablecoin data platform focused on USDC and Circle's business intelligence.

## Modules

### M1 — Macro Overview (宏观全景)
- Total stablecoin market cap and trends
- Market share comparison (USDC, USDT, USDS, DAI, FDUSD, PYUSD)
- Chain distribution heatmap
- Mint/burn flow analysis

### M3 — USDC / Circle
- USDC chain distribution
- Circle financial charts (revenue, operating costs, EBITDA)
- Revenue attribution model — waterfall / product / rate sensitivity views
  - Live 3-month T-Bill rate via FRED API
- CCTP cross-chain transfer dashboard
- CPN (Circle Payments Network) overview
- Nanopayments card
- US stablecoin ecosystem map — players, competitive comparison, GENIUS Act tracker
- On-chain vs exchange volume comparison (USDC vs USDT)

## Tech Stack

- **Framework**: Next.js 16 (App Router), TypeScript
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **Testing**: Vitest, 207 tests across 20 files
- **Data**: CoinGecko, DefiLlama, FRED (Federal Reserve)
- **Deployment**: Vercel (with Cron jobs for rate refresh)

## Getting Started

```bash
cd app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `app/.env.local`:

```env
# Optional — defaults to DEMO_KEY (rate-limited)
FRED_API_KEY=your_fred_api_key

# Required for Vercel Cron job authentication
CRON_SECRET=your_random_secret

# Required for treasury rate API (set to your Vercel deployment URL in production)
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

- **FRED API key**: Free at [fred.stlouisfed.org/docs/api/api_key.html](https://fred.stlouisfed.org/docs/api/api_key.html)
- **CRON_SECRET**: Any random string, used to authenticate Vercel Cron calls

## Running Tests

```bash
cd app
npx vitest run
```

## Deployment

```bash
cd app
npx vercel deploy
```

Set the environment variables above in the Vercel dashboard under Project → Settings → Environment Variables.

## Docs

- [Product Spec](docs/product-spec.md)
- [Circle Product Ecosystem](docs/circle-product-ecosystem.md)
- [Test Coverage](docs/test-coverage.md)
