import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ChainHeatmap } from '@/components/ChainHeatmap'
import type { ChainDistribution } from '@/types'

afterEach(cleanup)

const mockData: ChainDistribution[] = [
  { chain: 'Ethereum', symbol: 'USDT', supplyUsd: 60_000_000_000, pctOfTotal: 55 },
  { chain: 'Tron', symbol: 'USDT', supplyUsd: 40_000_000_000, pctOfTotal: 37 },
  { chain: 'Ethereum', symbol: 'USDC', supplyUsd: 25_000_000_000, pctOfTotal: 60 },
  { chain: 'Base', symbol: 'USDC', supplyUsd: 5_000_000_000, pctOfTotal: 12 },
]

describe('ChainHeatmap', () => {
  it('renders table with chain names', () => {
    render(<ChainHeatmap data={mockData} />)
    expect(screen.getByText('Ethereum')).toBeInTheDocument()
    expect(screen.getByText('Tron')).toBeInTheDocument()
    expect(screen.getByText('Base')).toBeInTheDocument()
  })

  it('renders column headers for symbols', () => {
    render(<ChainHeatmap data={mockData} />)
    // Use getAllByText since symbols appear in both header and cells
    expect(screen.getAllByText('USDT').length).toBeGreaterThan(0)
    expect(screen.getAllByText('USDC').length).toBeGreaterThan(0)
  })

  it('renders title', () => {
    render(<ChainHeatmap data={mockData} />)
    expect(screen.getByText('各链分布热力图')).toBeInTheDocument()
  })

  it('renders formatted USD values for populated cells', () => {
    render(<ChainHeatmap data={mockData} />)
    // Use getAllByText since values may appear multiple times
    expect(screen.getAllByText('$60.00B').length).toBeGreaterThan(0)
    expect(screen.getAllByText('$25.00B').length).toBeGreaterThan(0)
  })

  it('renders — for empty cells', () => {
    render(<ChainHeatmap data={mockData} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('renders skeleton when loading', () => {
    const { container } = render(<ChainHeatmap data={[]} isLoading />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    expect(screen.queryByText('Ethereum')).not.toBeInTheDocument()
  })

  it('renders all 7 chain rows', () => {
    render(<ChainHeatmap data={mockData} />)
    for (const chain of ['Ethereum', 'Tron', 'Solana', 'BSC', 'Arbitrum', 'Base', 'Polygon']) {
      expect(screen.getByText(chain)).toBeInTheDocument()
    }
  })

  it('handles empty data array without crashing', () => {
    render(<ChainHeatmap data={[]} />)
    expect(screen.getByText('各链分布热力图')).toBeInTheDocument()
  })
})
