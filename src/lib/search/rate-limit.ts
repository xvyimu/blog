/**
 * Process-local fixed window rate limit for /api/search.
 *
 * Semantics (origin best-effort):
 * - Counts only requests that reach this Node isolate (cache misses / uncached).
 * - CDN hits with Cache-Control s-maxage never enter this Map.
 * - Multi-instance serverless does not share buckets across isolates.
 * - Not a global security boundary; use platform Firewall/WAF for hard quotas.
 *
 * IP key: only `x-vercel-forwarded-for` (platform-owned). Generic XFF is ignored.
 */

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetMs: number;
};

type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

/** Max requests per window per key (IP). */
export const SEARCH_RATE_LIMIT_MAX = 60;
/** Window length in ms. */
export const SEARCH_RATE_LIMIT_WINDOW_MS = 60_000;

/** Prune stale buckets occasionally to avoid unbounded Map growth. */
const PRUNE_EVERY = 200;
let ops = 0;

function normalizeIp(value: string): string | null {
  const ip = value.trim().replace(/^\[|\]$/g, '');
  if (!ip) return null;

  const ipv4 = ip.split('.');
  if (
    ipv4.length === 4 &&
    ipv4.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
  ) {
    return ip;
  }

  if (ip.includes(':') && ip.length <= 45 && /^[0-9a-f:.]+$/i.test(ip)) {
    return ip;
  }

  return null;
}

function firstValidIp(header: string | null): string | null {
  if (!header) return null;
  for (const part of header.split(',')) {
    const ip = normalizeIp(part);
    if (ip) return ip;
  }
  return null;
}

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (now > bucket.reset) buckets.delete(key);
  }
}

export function checkSearchRateLimit(
  key: string,
  now = Date.now(),
  max = SEARCH_RATE_LIMIT_MAX,
  windowMs = SEARCH_RATE_LIMIT_WINDOW_MS,
): RateLimitResult {
  ops += 1;
  if (ops % PRUNE_EVERY === 0) prune(now);

  let bucket = buckets.get(key);
  if (!bucket || now > bucket.reset) {
    bucket = { count: 0, reset: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  const remaining = Math.max(0, max - bucket.count);
  return {
    ok: bucket.count <= max,
    remaining,
    resetMs: bucket.reset,
  };
}

/** Test helper — clear buckets between cases. */
export function resetSearchRateLimitForTests() {
  buckets.clear();
  ops = 0;
}

export function clientKeyFromRequest(request: Request): string {
  // Vercel overwrites x-forwarded-for to prevent spoofing and exposes the
  // platform-owned value separately so an upstream proxy cannot replace it.
  const vercelForwarded = firstValidIp(request.headers.get('x-vercel-forwarded-for'));
  if (vercelForwarded) return vercelForwarded;
  return 'anonymous';
}
