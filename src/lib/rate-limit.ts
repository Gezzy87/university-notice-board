// Lightweight in-memory sliding-window rate limiter for Server Actions.
//
// Per-process only: effective on a single server instance (local dev, one Node
// host). On multi-instance serverless (e.g. Vercel with several lambdas), move
// to a shared store like Upstash Redis for a global limit. Auth endpoints are
// rate-limited separately by Better Auth (see src/lib/auth.ts).

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}

/**
 * Returns { ok: true } if the action is allowed, or { ok: false, retryAfter }
 * (seconds) if the caller has exceeded `max` requests within `windowMs`.
 */
export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  sweep(now);

  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (b.count >= max) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count++;
  return { ok: true };
}

/** Convenience: friendly "too many requests" message with the retry hint. */
export function rateLimited(
  key: string,
  max: number,
  windowMs: number,
): { error: string } | null {
  const r = rateLimit(key, max, windowMs);
  if (r.ok) return null;
  return {
    error: `You're doing that too fast — try again in ${r.retryAfter}s.`,
  };
}
