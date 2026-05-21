import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

function makeRatelimiter(tokens: number, window: string) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  const redis = new Redis({ url, token });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    analytics: false,
  });
}

export const loginLimiter = makeRatelimiter(10, '15 m');
export const syncLimiter = makeRatelimiter(5, '1 h');
export const insightLimiter = makeRatelimiter(3, '1 d');

export async function checkRateLimit(
  limiter: ReturnType<typeof makeRatelimiter>,
  identifier: string
): Promise<NextResponse | null> {
  if (!limiter) return null;
  const result = await limiter.limit(identifier);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)) },
      }
    );
  }
  return null;
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'anonymous'
  );
}
