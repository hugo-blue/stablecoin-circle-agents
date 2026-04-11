import { NextRequest, NextResponse } from 'next/server'
import { fetchAllNews } from '@/lib/api/news-rss'

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get('category') ?? 'all'
    const limitParam = req.nextUrl.searchParams.get('limit')
    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 50) : 20

    const all = await fetchAllNews()

    const filtered = category === 'all'
      ? all
      : all.filter(n => n.tags.includes(category))

    return NextResponse.json({
      data: filtered.slice(0, limit),
      total: filtered.length,
      category,
      state: filtered.length > 0 ? 'success' : 'empty',
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('News route error:', error)
    return NextResponse.json({
      data: [],
      total: 0,
      category: 'all',
      state: 'error',
      updatedAt: new Date().toISOString(),
    })
  }
}
