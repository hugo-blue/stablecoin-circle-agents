import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ProductArchitectureMap } from '@/components/ProductArchitectureMap'
import { PRODUCT_NODES } from '@/lib/data/circle-products'

afterEach(cleanup)

describe('ProductArchitectureMap', () => {
  it('renders section title', () => {
    render(<ProductArchitectureMap nodes={PRODUCT_NODES} />)
    expect(screen.getByText('Circle 产品架构')).toBeInTheDocument()
  })

  it('renders all product nodes', () => {
    render(<ProductArchitectureMap nodes={PRODUCT_NODES} />)
    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByText('CCTP v2')).toBeInTheDocument()
    expect(screen.getByText('CPN')).toBeInTheDocument()
    expect(screen.getByText('Nanopayments')).toBeInTheDocument()
  })

  it('renders layer labels', () => {
    render(<ProductArchitectureMap nodes={PRODUCT_NODES} />)
    expect(screen.getByText('资产层')).toBeInTheDocument()
    expect(screen.getByText('基础设施')).toBeInTheDocument()
    expect(screen.getByText('网络层')).toBeInTheDocument()
    expect(screen.getByText('应用层')).toBeInTheDocument()
  })

  it('shows metric values for nodes', () => {
    render(<ProductArchitectureMap nodes={PRODUCT_NODES} />)
    expect(screen.getByText('$75.3B')).toBeInTheDocument()
    expect(screen.getByText('$126B')).toBeInTheDocument()
  })

  it('shows testnet badges for non-live products', () => {
    render(<ProductArchitectureMap nodes={PRODUCT_NODES} />)
    const testnetBadges = screen.getAllByText('testnet')
    expect(testnetBadges.length).toBeGreaterThanOrEqual(2) // Arc, Nanopayments, StableFX
  })
})
