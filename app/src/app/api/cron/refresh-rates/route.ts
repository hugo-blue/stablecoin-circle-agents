import { NextRequest, NextResponse } from 'next/server'
import { fetchLatestTreasuryRate } from '@/lib/api/fred'

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const latest = await fetchLatestTreasuryRate()

    console.log(
      `[cron/refresh-rates] Treasury rate updated: ${latest.date} = ${(latest.rate * 100).toFixed(2)}%`
    )

    return NextResponse.json({
      data: { rate: latest },
      state: 'success',
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[cron/refresh-rates] Failed to refresh treasury rate:', error)
    return NextResponse.json(
      { data: null, state: 'error', updatedAt: null, error: 'Failed to refresh rates' },
      { status: 502 }
    )
  }
}
