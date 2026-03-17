import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { CircleKeyMetricsTrend } from '@/components/CircleKeyMetricsTrend'

const MOCK_DATA = {
  state: 'success',
  data: [
    { date: '2024-04', totalMarketCapB: 150, usdcMarketCapB: 32, usdcSharePct: 21.3, tbillRate: 5.33 },
    { date: '2024-08', totalMarketCapB: 170, usdcMarketCapB: 36, usdcSharePct: 21.2, tbillRate: 5.25 },
    { date: '2024-12', totalMarketCapB: 200, usdcMarketCapB: 45, usdcSharePct: 22.5, tbillRate: 4.49 },
    { date: '2025-06', totalMarketCapB: 230, usdcMarketCapB: 60, usdcSharePct: 26.1, tbillRate: 4.15 },
    { date: '2025-12', totalMarketCapB: 270, usdcMarketCapB: 75, usdcSharePct: 27.8, tbillRate: 3.81 },
  ],
  updatedAt: '2026-03-18T00:00:00Z',
}

describe('CircleKeyMetricsTrend', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_DATA),
    }))
  })

  it('renders section title', () => {
    render(<CircleKeyMetricsTrend />)
    expect(screen.getByText('核心指标趋势')).toBeInTheDocument()
  })

  it('shows loading skeleton initially', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: () => new Promise(() => {}),
    })))
    render(<CircleKeyMetricsTrend />)
    expect(screen.getByText(/加载中/)).toBeInTheDocument()
  })

  it('renders four metric card titles after load', async () => {
    render(<CircleKeyMetricsTrend />)
    await waitFor(() => {
      expect(screen.getByText('稳定币总市值')).toBeInTheDocument()
      expect(screen.getByText('USDC 市值')).toBeInTheDocument()
      expect(screen.getByText('USDC 占比')).toBeInTheDocument()
      expect(screen.getByText('T-Bill 利率')).toBeInTheDocument()
    })
  })

  it('shows latest total market cap value', async () => {
    render(<CircleKeyMetricsTrend />)
    await waitFor(() => {
      expect(screen.getByText('$270B')).toBeInTheDocument()
    })
  })

  it('shows latest USDC market cap value', async () => {
    render(<CircleKeyMetricsTrend />)
    await waitFor(() => {
      expect(screen.getByText('$75.0B')).toBeInTheDocument()
    })
  })

  it('shows latest USDC share percentage', async () => {
    render(<CircleKeyMetricsTrend />)
    await waitFor(() => {
      expect(screen.getByText('27.8%')).toBeInTheDocument()
    })
  })

  it('shows latest T-Bill rate', async () => {
    render(<CircleKeyMetricsTrend />)
    await waitFor(() => {
      expect(screen.getByText('3.81%')).toBeInTheDocument()
    })
  })

  it('shows MoM change indicators', async () => {
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

  it('handles fetch error gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    render(<CircleKeyMetricsTrend />)
    await waitFor(() => {
      expect(screen.queryByText(/加载中/)).not.toBeInTheDocument()
    })
    expect(screen.getByText('核心指标趋势')).toBeInTheDocument()
  })
})
