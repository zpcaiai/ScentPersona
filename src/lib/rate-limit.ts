/** Best-effort in-memory fixed-window rate limiter (per-instance; fine for abuse-throttling admin endpoints). */
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, b] of buckets) if (now >= b.reset) buckets.delete(k); // lazy prune
  const b = buckets.get(key);
  if (!b || now >= b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }
  if (b.count >= limit) return { ok: false, remaining: 0, retryAfterMs: b.reset - now };
  b.count++;
  return { ok: true, remaining: limit - b.count, retryAfterMs: 0 };
}
