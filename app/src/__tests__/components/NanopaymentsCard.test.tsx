import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { NanopaymentsCard } from '@/components/NanopaymentsCard'
import { NANOPAYMENTS_DATA } from '@/lib/data/circle-products'

afterEach(cleanup)

describe('NanopaymentsCard', () => {
  it('renders title', () => {
    render(<NanopaymentsCard data={NANOPAYMENTS_DATA} />)
    expect(screen.getByText('Nanopayments')).toBeInTheDocument()
  })

  it('shows testnet badge', () => {
    render(<NanopaymentsCard data={NANOPAYMENTS_DATA} />)
    expect(screen.getByText('Testnet')).toBeInTheDocument()
  })

  it('shows supported chains count', () => {
    render(<NanopaymentsCard data={NANOPAYMENTS_DATA} />)
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('shows minimum payment amount', () => {
    render(<NanopaymentsCard data={NANOPAYMENTS_DATA} />)
    expect(screen.getByText('$0.000001')).toBeInTheDocument()
  })

  it('shows gateway contract address snippet', () => {
    render(<NanopaymentsCard data={NANOPAYMENTS_DATA} />)
    expect(screen.getByText(/0x7777/)).toBeInTheDocument()
  })
})
