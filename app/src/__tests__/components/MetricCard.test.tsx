import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MetricCard } from '@/components/MetricCard'

afterEach(cleanup)

describe('MetricCard', () => {
  it('renders value formatted as USD', () => {
    render(<MetricCard label="USDT 市值" value={68_432_000_000} />)
    expect(screen.getByText('$68.43B')).toBeInTheDocument()
    expect(screen.getByText('USDT 市值')).toBeInTheDocument()
  })

  it('renders positive 24h change in green', () => {
    render(<MetricCard label="USDT" value={68e9} change24h={2.3} />)
    const change = screen.getByText('+2.30%')
    expect(change).toBeInTheDocument()
    expect(change.closest('p')).toHaveClass('text-green-600')
  })

  it('renders negative 24h change in red', () => {
    render(<MetricCard label="USDT" value={68e9} change24h={-1.5} />)
    const change = screen.getByText('-1.50%')
    expect(change).toBeInTheDocument()
    expect(change.closest('p')).toHaveClass('text-red-500')
  })

  it('renders $— for null value', () => {
    render(<MetricCard label="Test" value={null} />)
    expect(screen.getByText('$—')).toBeInTheDocument()
  })

  it('renders $0.00 for zero value', () => {
    render(<MetricCard label="Test" value={0} />)
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  it('renders skeleton when loading', () => {
    const { container } = render(<MetricCard label="Test" value={null} isLoading />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    // Loading state should not show the label
    expect(container.querySelector('.animate-pulse')?.textContent).not.toContain('Test')
  })

  it('renders stale warning when isStale', () => {
    render(<MetricCard label="Test" value={100} isStale />)
    expect(screen.getByText('数据可能不是最新')).toBeInTheDocument()
  })

  it('does not render stale warning by default', () => {
    render(<MetricCard label="Test" value={100} />)
    expect(screen.queryByText('数据可能不是最新')).not.toBeInTheDocument()
  })

  it('does not render change when change24h is undefined', () => {
    render(<MetricCard label="Test" value={100} />)
    expect(screen.queryByText('24h')).not.toBeInTheDocument()
  })
})
