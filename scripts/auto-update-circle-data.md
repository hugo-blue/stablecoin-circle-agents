# Auto-update runbook — Circle quarterly data

This is the task the scheduled agent runs (weekly). Goal: keep the StablePulse
dashboard current with Circle's latest reported quarter, with **zero manual
prompting**. If nothing new has been reported, it must make no changes.

## Steps

1. **Find what we already have.** Read `app/src/lib/data/circle-financials.ts`
   and note the newest `period` in `CIRCLE_FINANCIALS` (e.g. `2026-Q1`).

2. **Check for a newer quarter.** Look for a Circle quarterly results press
   release newer than that period:
   - Circle pressroom: https://www.circle.com/pressroom (search "Reports … Quarter … Results")
   - SEC EDGAR (Circle Internet Group, ticker CRCL): newest 10-Q / 10-K filing.
   Circle typically reports ~early Feb (Q4/FY), May (Q1), Aug (Q2), Nov (Q3).
   - If the newest reported quarter is **already in the file → STOP, exit with no
     changes** (and no commit).

3. **Gather the figures** for the new quarter from the press release / 10-Q:
   total revenue & reserve income, reserve income, other revenue, total
   distribution/transaction/other costs, net income (continuing ops), adjusted
   EBITDA, USDC in circulation (quarter end) and average, reserve return rate,
   on-chain transaction volume, CCTP volume, CPN annualized TPV, stablecoin
   market share. Cross-check at least two sources (Circle + one news/SEC source).

4. **Update the data files** following the table and conventions in
   `app/src/lib/data/README.md`. Repoint `LATEST_ATTRIBUTION` /
   `LATEST_OTHER_REVENUE` and include `period` + `periodLabel` on the new
   attribution const. Label any estimated split with `// estimated`. Bump each
   file's `Last updated:` to today.

5. **Also refresh on-chain volume** (`volume-onchain.ts`): append any new full
   months and update the latest-period summary (Mizuho adjusted USDC vs USDT).
   Do not skip this file — it powers the "USDC vs USDT 交易量深度对比" section.

6. **Validate.** `cd app && npm install && npx vitest run` then
   `npx tsc --noEmit`. If literal assertions fail on values you changed, update
   those test literals (search `src/__tests__` for the old number). Both must pass.

7. **Ship.** Commit on `main` and push — Vercel auto-deploys from GitHub.
   Commit message: `data: refresh Circle metrics to <QUARTER>`.
   End the commit with the standard `Co-Authored-By` trailer.

8. **Report** a one-line summary of what changed (or "no new quarter — no-op").

## Guardrails
- Never invent figures. If a key headline number can't be sourced, skip the
  update and report what was missing rather than committing placeholders.
- Only touch the four data files + their test literals. Do not refactor.
- If tests fail for reasons unrelated to your change, do not push; report it.
