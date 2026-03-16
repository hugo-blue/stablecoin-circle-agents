import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { CPNNetworkCard } from '@/components/CPNNetworkCard'
import { CPN_DATA } from '@/lib/data/circle-products'

afterEach(cleanup)

describe('CPNNetworkCard', () => {
  it('renders title', () => {
    render(<CPNNetworkCard data={CPN_DATA} />)
    expect(screen.getByText('Circle Payments Network')).toBeInTheDocument()
  })

  it('shows enrolled institutions count', () => {
    render(<CPNNetworkCard data={CPN_DATA} />)
    expect(screen.getByText('55')).toBeInTheDocument()
  })

  it('shows annualized TPV', () => {
    render(<CPNNetworkCard data={CPN_DATA} />)
    expect(screen.getByText('$5.70B')).toBeInTheDocument()
  })

  it('shows settlement chains', () => {
    render(<CPNNetworkCard data={CPN_DATA} />)
    expect(screen.getByText('Ethereum')).toBeInTheDocument()
    expect(screen.getByText('Polygon')).toBeInTheDocument()
    expect(screen.getByText('Solana')).toBeInTheDocument()
  })

  it('shows live status indicator', () => {
    render(<CPNNetworkCard data={CPN_DATA} />)
    expect(screen.getByText('运行中')).toBeInTheDocument()
  })

  it('shows live partners', () => {
    render(<CPNNetworkCard data={CPN_DATA} />)
    expect(screen.getByText('Alfred Pay')).toBeInTheDocument()
    expect(screen.getByText('Tazapay')).toBeInTheDocument()
  })
})
