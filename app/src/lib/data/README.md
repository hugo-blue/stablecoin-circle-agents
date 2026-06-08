# Circle / USDC seed data — refresh conventions

These files hold **curated** figures that come from SEC filings and earnings
calls (no clean public API). They are refreshed each quarter — manually, or by
the scheduled auto-update agent (see `scripts/auto-update-circle-data.md`).

Live data (market caps, on-chain transfer volume, T-bill rate, mint/burn) is
fetched at runtime via API routes and does **not** live here.

## Files & what to add each new quarter

| File | What to update |
|------|----------------|
| `circle-financials.ts` | Append one `CIRCLE_FINANCIALS` row for the new `YYYY-Qn`. Update the header `Last updated:` and the source comment. |
| `revenue-attribution.ts` | Add `RESERVE_RETURN_RATES['YYYY-Qn']`; add a new `Qn_YYYY_ATTRIBUTION` const (include `period` + `periodLabel`) and `OTHER_REVENUE_BREAKDOWN_Qn_YYYY`; **repoint `LATEST_ATTRIBUTION` / `LATEST_OTHER_REVENUE` to them.** |
| `circle-products.ts` | Append a `CCTP_METRICS.quarterly` entry (`{ period, volumeUsd, txCount, yoyGrowth }`); bump `cumulativeVolumeUsd` and `totalTransfers`; update `CPN_DATA.annualizedTpvUsd`; update `PRODUCT_NODES` metric values (USDC circulation, CCTP cumulative, CPN TPV). |
| `volume-onchain.ts` | Append new months to `ONCHAIN_VOLUME_MONTHLY`; refresh the latest-period block in `ONCHAIN_VOLUME_ANNUAL`. |

## Design rule: UI reads the *latest*, not a hardcoded quarter

Components derive the current quarter dynamically so a data bump needs no
component edits:

- `RevenueAttributionChart` reads `LATEST_ATTRIBUTION` / `LATEST_OTHER_REVENUE`
  (and `LATEST_ATTRIBUTION.periodLabel` for the heading).
- `CCTPFlowDashboard` reads the last entry of `CCTP_METRICS.quarterly`.
- `VolumeComparisonChart` reads the last entry of `ONCHAIN_VOLUME_MONTHLY`.

So the only code change per quarter is **data + repointing `LATEST_*`**.

## Honesty

Mark every estimated/modeled number with an inline comment (`// estimated`).
Disclosed totals (revenue, reserve income, EBITDA, circulation) are exact;
internal splits (other-revenue components, per-product CCTP/CPN fees) are
estimates and must stay labeled as such in the UI.

## After editing

Run the suite and fix any literal assertions on changed values:

```bash
cd app && npx vitest run && npx tsc --noEmit
```
