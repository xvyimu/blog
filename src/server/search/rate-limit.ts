/**
 * 搜索 API 进程内固定窗口限流。
 *
 * 语义（origin 尽力而为）：
 * - 只统计到达本 Node isolate 的请求（缓存未命中/未缓存）
 * - 带 s-maxage 的 CDN 命中不会进入本 Map
 * - 多实例 serverless 不跨 isolate 共享计数
 * - 不是全局安全边界；硬配额应放在平台 Firewall/WAF
 *
 * IP key 仅信任平台所有的 `x-vercel-forwarded-for`，忽略可伪造的通用转发头。
 */

/** 单次限流检查结果：是否放行、剩余配额与窗口重置时间。 */
export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetMs: number;
};

type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

/** 每个 key 在窗口内允许的最大请求数。 */
export const SEARCH_RATE_LIMIT_MAX = 60;
/** 限流窗口长度（毫秒）。 */
export const SEARCH_RATE_LIMIT_WINDOW_MS = 60_000;

/** 每隔若干次操作清理过期 bucket，避免 Map 无界增长。 */
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

/**
 * 对给定 key 执行固定窗口计数并返回是否放行。
 * @param key 限流键，通常来自 clientKeyFromRequest
 * @param now 可选当前时间戳，便于测试注入
 * @param max 窗口内最大次数，默认 SEARCH_RATE_LIMIT_MAX
 * @param windowMs 窗口毫秒数，默认 SEARCH_RATE_LIMIT_WINDOW_MS
 */
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

/** 测试专用：清空限流桶与操作计数，避免用例间串扰。 */
export function resetSearchRateLimitForTests() {
  buckets.clear();
  ops = 0;
}

/**
 * 从请求提取可信限流 key。
 * 仅接受合法 `x-vercel-forwarded-for`；无有效 IP 时回退 `anonymous`。
 */
export function clientKeyFromRequest(request: Request): string {
  // Vercel 维护平台侧转发头，防止上游伪造通用 XFF。
  const vercelForwarded = firstValidIp(request.headers.get('x-vercel-forwarded-for'));
  if (vercelForwarded) return vercelForwarded;
  return 'anonymous';
}
