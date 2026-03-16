import { describe, it, expect, afterEach, beforeAll } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { MintBurnChart } from '@/components/MintBurnChart'
import type { MultiCoinFlow } from '@/types'

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

afterEach(cleanup)

const mockData: MultiCoinFlow[] = Array.from({ length: 60 }, (_, i) => ({
  date: `2024-01-${String(i + 1).padStart(2, '0')}`,
  USDT: 100_000_000 + i * 1_000_000,
  USDC: 50_000_000 - i * 500_000,
  DAI: 5_000_000,
  FDUSD: 1_000_000,
}))

describe('MintBurnChart', () => {
  it('renders title', () => {
    render(<MintBurnChart data={mockData} />)
    expect(screen.getByText('发行 vs 赎回净流量')).toBeInTheDocument()
  })

  it('renders period buttons', () => {
    render(<MintBurnChart data={mockData} />)
    expect(screen.getByText('30D')).toBeInTheDocument()
    expect(screen.getByText('90D')).toBeInTheDocument()
    expect(screen.getByText('1Y')).toBeInTheDocument()
  })

  it('renders skeleton when loading', () => {
    const { container } = render(<MintBurnChart data={[]} isLoading />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    expect(screen.queryByText('发行 vs 赎回净流量')).not.toBeInTheDocument()
  })

  it('handles empty data without crashing', () => {
    render(<MintBurnChart data={[]} />)
    expect(screen.getByText('发行 vs 赎回净流量')).toBeInTheDocument()
  })

  it('switches period on button click', () => {
    render(<MintBurnChart data={mockData} />)
    const btn90d = screen.getByText('90D')
    fireEvent.click(btn90d)
    expect(btn90d.className).toContain('bg-blue-600')
  })

  it('30D is default active period', () => {
    render(<MintBurnChart data={mockData} />)
    expect(screen.getByText('30D').className).toContain('bg-blue-600')
  })

  it('accepts multi-coin data without crashing', () => {
    // Verifies stacked bar chart handles data with multiple coin keys
    const data = [{ date: '2024-01-01', USDT: 100, USDC: -50, DAI: 10, FDUSD: 0 }]
    render(<MintBurnChart data={data} />)
    expect(screen.getByText('发行 vs 赎回净流量')).toBeInTheDocument()
  })
})
