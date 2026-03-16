import { describe, it, expect, afterEach, beforeAll } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { MarketShareChart } from '@/components/MarketShareChart'

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

afterEach(cleanup)

const mockData = Array.from({ length: 60 }, (_, i) => ({
  date: `2024-01-${String(i + 1).padStart(2, '0')}`,
  USDT: 65 - i * 0.1,
  USDC: 20 + i * 0.05,
  DAI: 5,
  FDUSD: 3,
  Other: 7 + i * 0.05,
}))

describe('MarketShareChart', () => {
  it('renders title', () => {
    render(<MarketShareChart data={mockData} />)
    expect(screen.getByText('市占率趋势')).toBeInTheDocument()
  })

  it('renders time range buttons', () => {
    render(<MarketShareChart data={mockData} />)
    expect(screen.getByText('7D')).toBeInTheDocument()
    expect(screen.getByText('30D')).toBeInTheDocument()
    expect(screen.getByText('1Y')).toBeInTheDocument()
    expect(screen.getByText('ALL')).toBeInTheDocument()
  })

  it('30D is default active', () => {
    render(<MarketShareChart data={mockData} />)
    expect(screen.getByText('30D').className).toContain('bg-blue-600')
  })

  it('switches time range on click', () => {
    render(<MarketShareChart data={mockData} />)
    const btn7d = screen.getByText('7D')
    fireEvent.click(btn7d)
    expect(btn7d.className).toContain('bg-blue-600')
    // 30D should no longer be active
    expect(screen.getByText('30D').className).not.toContain('bg-blue-600')
  })

  it('renders skeleton when loading', () => {
    const { container } = render(<MarketShareChart data={[]} isLoading />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('handles empty data without crashing', () => {
    render(<MarketShareChart data={[]} />)
    expect(screen.getByText('市占率趋势')).toBeInTheDocument()
  })

  it('handles single data point', () => {
    render(<MarketShareChart data={[mockData[0]]} />)
    expect(screen.getByText('市占率趋势')).toBeInTheDocument()
  })
})
