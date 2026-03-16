import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { CCTPFlowDashboard } from '@/components/CCTPFlowDashboard'
import { CCTP_METRICS } from '@/lib/data/circle-products'

afterEach(cleanup)

describe('CCTPFlowDashboard', () => {
  it('renders headline metrics', () => {
    render(<CCTPFlowDashboard data={CCTP_METRICS} />)
    expect(screen.getByText('CCTP 跨链转账')).toBeInTheDocument()
    expect(screen.getByText('$126.00B')).toBeInTheDocument()
    expect(screen.getByText('$41.30B')).toBeInTheDocument()
  })

  it('renders summary metric cards', () => {
    render(<CCTPFlowDashboard data={CCTP_METRICS} />)
    expect(screen.getByText('累计交易量')).toBeInTheDocument()
    expect(screen.getByText('6M+')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('renders view toggle buttons', () => {
    render(<CCTPFlowDashboard data={CCTP_METRICS} />)
    expect(screen.getByText('链对流量')).toBeInTheDocument()
    expect(screen.getByText('季度趋势')).toBeInTheDocument()
  })

  it('can toggle between views', () => {
    render(<CCTPFlowDashboard data={CCTP_METRICS} />)
    const btn = screen.getByText('季度趋势')
    fireEvent.click(btn)
    // Button should become active
    expect(btn).toHaveClass('bg-blue-600')
  })

  it('shows contract address snippet', () => {
    render(<CCTPFlowDashboard data={CCTP_METRICS} />)
    expect(screen.getByText('0x28b5...cf5d')).toBeInTheDocument()
  })

  it('shows supported chains in subtitle', () => {
    render(<CCTPFlowDashboard data={CCTP_METRICS} />)
    expect(screen.getByText(/17/)).toBeInTheDocument()
  })
})
