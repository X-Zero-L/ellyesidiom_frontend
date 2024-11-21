import { NextResponse } from 'next/server'

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5 // 5 requests per minute

interface RateLimitRecord {
  count: number
  timestamp: number
}

const ipRequestCounts = new Map<string, RateLimitRecord>()

export function rateLimit(ip: string): boolean {
  const now = Date.now()
  const record = ipRequestCounts.get(ip) || { count: 0, timestamp: now }

  if (now - record.timestamp > RATE_LIMIT_WINDOW) {
    record.count = 1
    record.timestamp = now
  } else {
    record.count++
  }

  ipRequestCounts.set(ip, record)

  return record.count <= MAX_REQUESTS_PER_WINDOW
}

export function handleRequestWithRateLimit(
  request: Request,
  apiPath: string,
  handler: (request: Request) => Promise<Response>
): Promise<Response> {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  if (!rateLimit(ip)) {
    return Promise.resolve(
      NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        { status: 429 }
      )
    )
  }

  return handler(request)
}

