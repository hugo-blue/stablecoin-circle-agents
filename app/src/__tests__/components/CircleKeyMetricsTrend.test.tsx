import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { CircleKeyMetricsTrend } from '@/components/CircleKeyMetricsTrend'

const MOCK_DATA = {
  state: 'success',
  data: [
    { date: '2024-01', totalMarketCapB: 130, usdcMarketCapB: 27, usdcSharePct: 20.8, tbillRate: 5.33 },
    { date: '2024-06', totalMarketCapB: 160, usdcMarketCapB: 32, usdcSharePct: 20.0, tbillRate: 5.25 },
    { date: '2024-12', totalMarketCapB: 200, usdcMarketCapB: 45, usdcSharePct: 22.5, tbillRate: 4.49 },
    { date: '2025-06', totalMarketCapB: 230, usdcMarketCapB: 60, usdcSharePct: 26.1, tbillRate: 4.15 },
    { date: '2025-12', totalMarketCapB: 270, usdcMarketCapB: 75, usdcSharePct: 27.8, tbillRate: 3.81 },
  ],
  updatedAt: '2026-03-17T00:00:00Z',
}

describe('CircleKeyMetricsTrend', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_DATA),
    }))
  })

  it('renders component title', () => {
    render(<CircleKeyMetricsTrend />)
    expect(screen.getByText('核心指标趋势')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    // fetch resolves after render — loading shown on first paint
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: () => new Promise(() => {}), // json never resolves → stays loading
    })))
    render(<CircleKeyMetricsTrend />)
    expect(screen.getByText(/加载中/)).toBeInTheDocument()
  })

  it('renders three metric summary cards after data loads', async () => {
    render(<CircleKeyMetricsTrend />)
    await waitFor(() => {
      // Use getAllByText since legend may also contain these strings
      expect(screen.getAllByText('稳定币总市值').length).toBeGreaterThan(0)
      expect(screen.getAllByText('USDC 市场占比').length).toBeGreaterThan(0)
      expect(screen.getAllByText('3M T-Bill 利率').length).toBeGreaterThan(0)
    })
  })

  it('displays latest total market cap in summary card', async () => {
    render(<CircleKeyMetricsTrend />)
    await waitFor(() => {
      // latest totalMarketCapB = 270 → shown as "$270B"
      expect(screen.getByText('$270B')).toBeInTheDocument()
    })
  })

  it('displays latest USDC share percentage in summary card', async () => {
    render(<CircleKeyMetricsTrend />)
    await waitFor(() => {
      // latest usdcSharePct = 27.8 → shown as "27.8%"
      expect(screen.getByText('27.8%')).toBeInTheDocument()
    })
  })

  it('displays latest T-Bill rate in summary card', async () => {
    render(<CircleKeyMetricsTrend />)
    await waitFor(() => {
      // latest tbillRate = 3.81 → shown as "3.81%"
      expect(screen.getByText('3.81%')).toBeInTheDocument()
    })
  })

  it('shows delta change indicators', async () => {
    render(<CircleKeyMetricsTrend />)
    await waitFor(() => {
      const arrows = screen.queryAllByText(/↑|↓/)
      expect(arrows.length).toBeGreaterThan(0)
    })
  })

  it('shows data source note', async () => {
    render(<CircleKeyMetricsTrend />)
    await waitFor(() => {
      expect(screen.getByText(/DefiLlama/)).toBeInTheDocument()
    })
  })

  it('handles fetch error gracefully without crashing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    render(<CircleKeyMetricsTrend />)
    await waitFor(() => {
      expect(screen.queryByText(/加载中/)).not.toBeInTheDocument()
    })
    // Title still renders
    expect(screen.getByText('核心指标趋势')).toBeInTheDocument()
  })
})
