import type { StablecoinMarket } from '@/types'

const BASE_URL = 'https://api.coingecko.com/api/v3'

const STABLECOIN_IDS = ['tether', 'usd-coin', 'dai', 'first-digital-usd', 'paypal-usd']

export async function fetchStablecoinMarkets(): Promise<StablecoinMarket[]> {
  const ids = STABLECOIN_IDS.join(',')
  const res = await fetch(
    `${BASE_URL}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false`,
    { next: { revalidate: 55 } } // 55s cache (refresh every 60s)
  )
  if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`)
  const data = await res.json()

  return data.map((coin: any) => ({
    id: coin.id,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    marketCap: coin.market_cap || 0,
    price: coin.current_price || 0,
    priceChange24h: coin.price_change_percentage_24h || 0,
    circulatingSupply: coin.circulating_supply || 0,
  }))
}
