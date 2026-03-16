import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { USStablecoinEcosystem } from '@/components/USStablecoinEcosystem'

afterEach(cleanup)

describe('USStablecoinEcosystem', () => {
  it('renders title', () => {
    render(<USStablecoinEcosystem />)
    expect(screen.getByText('美国稳定币生态全景')).toBeInTheDocument()
  })

  it('renders tab buttons', () => {
    render(<USStablecoinEcosystem />)
    expect(screen.getByText('生态地图')).toBeInTheDocument()
    expect(screen.getByText('竞争对比')).toBeInTheDocument()
    expect(screen.getByText('GENIUS Act')).toBeInTheDocument()
  })

  it('shows ecosystem map view by default', () => {
    render(<USStablecoinEcosystem />)
    // Circle center card
    expect(screen.getByText('Circle / USDC')).toBeInTheDocument()
    // Some player names
    expect(screen.getByText('Tether / USDT')).toBeInTheDocument()
    expect(screen.getByText('Coinbase')).toBeInTheDocument()
  })

  it('shows relationship badges', () => {
    render(<USStablecoinEcosystem />)
    expect(screen.getAllByText('竞争').length).toBeGreaterThan(0)
    expect(screen.getAllByText('合作').length).toBeGreaterThan(0)
  })

  it('shows category labels', () => {
    render(<USStablecoinEcosystem />)
    expect(screen.getByText('发行方')).toBeInTheDocument()
    expect(screen.getByText('银行')).toBeInTheDocument()
    expect(screen.getByText('卡网络')).toBeInTheDocument()
  })

  it('can switch to comparison view', () => {
    render(<USStablecoinEcosystem />)
    fireEvent.click(screen.getByText('竞争对比'))
    expect(screen.getByText('市值')).toBeInTheDocument()
    expect(screen.getByText('日交易量')).toBeInTheDocument()
    expect(screen.getByText('合规状态')).toBeInTheDocument()
  })

  it('can switch to GENIUS Act view', () => {
    render(<USStablecoinEcosystem />)
    fireEvent.click(screen.getByText('GENIUS Act'))
    expect(screen.getByText('GENIUS Act 生效倒计时')).toBeInTheDocument()
    expect(screen.getByText('核心条款')).toBeInTheDocument()
    expect(screen.getByText('受益方')).toBeInTheDocument()
    expect(screen.getByText('受损方')).toBeInTheDocument()
  })

  it('shows GENIUS Act winners and losers', () => {
    render(<USStablecoinEcosystem />)
    fireEvent.click(screen.getByText('GENIUS Act'))
    // Check for specific winner/loser names
    expect(screen.getByText('已符合多数要求，合规成本最低')).toBeInTheDocument()
    expect(screen.getByText('需在美注册实体或获等效认定，合规成本大增')).toBeInTheDocument()
  })

  it('shows impact assessment for all players', () => {
    render(<USStablecoinEcosystem />)
    fireEvent.click(screen.getByText('GENIUS Act'))
    // Impact badges
    expect(screen.getAllByText(/利好/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/利空/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/中性/).length).toBeGreaterThan(0)
  })
})
