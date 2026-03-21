import { extractPayToAddress } from '@/lib/x402'

type ProbeOptions = {
  timeoutMs?: number
  method?: 'GET' | 'POST'
}

/**
 * Sends a GET request to `endpoint` and extracts the payTo address from
 * the X-Payment-Requirements header of a 402 response.
 *
 * Returns null if:
 * - The URL is empty / null
 * - The server does not respond with 402
 * - The header is missing or malformed
 * - The network request fails or times out
 */
export async function probeX402Endpoint(
  endpoint: string,
  options: ProbeOptions = {}
): Promise<string | null> {
  if (!endpoint) return null

  const { timeoutMs = 8_000, method = 'GET' } = options

  const timeout = new Promise<null>(resolve =>
    setTimeout(() => resolve(null), timeoutMs)
  )

  const probe = fetch(endpoint, {
    method,
    headers: { 'User-Agent': 'x402-probe/1.0 StablePulse' },
  }).then(response => {
    if (response.status !== 402) return null
    const header = response.headers.get('x-payment-requirements')
    return extractPayToAddress(header)
  }).catch(() => null)

  return Promise.race([probe, timeout])
}
