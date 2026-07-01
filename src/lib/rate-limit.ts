/**
 * Rate limiter with an optional Upstash Redis (REST) backend for cross-instance
 * limits. If Upstash isn't configured — or is unreachable — it transparently
 * falls back to a per-instance in-memory window, so the app always works.
 */
const buckets = new Map<string, { count: number; reset: number }>();

function memoryRateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, b] of buckets) if (now >= b.reset) buckets.delete(k);
  const b = buckets.get(key);
  if (!b || now >= b.reset) { buckets.set(key, { count: 1, reset: now + windowMs }); return { ok: true, remaining: limit - 1, retryAfterMs: 0 }; }
  if (b.count >= limit) return { ok: false, remaining: 0, retryAfterMs: b.reset - now };
  b.count++;
  return { ok: true, remaining: limit - b.count, retryAfterMs: 0 };
}

async function upstash(parts: (string | number)[]): Promise<number> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 1000); // never let a slow/broken Redis stall a request
  try {
    const res = await fetch(`${url}/${parts.map((p) => encodeURIComponent(String(p))).join("/")}`, {
      headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal, cache: "no-store",
    });
    if (!res.ok) throw new Error(`upstash ${res.status}`);
    return Number(((await res.json()) as { result: unknown }).result);
  } finally { clearTimeout(timer); }
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<{ ok: boolean; remaining: number; retryAfterMs: number }> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const n = await upstash(["INCR", key]);
      if (n === 1) await upstash(["PEXPIRE", key, windowMs]);
      if (n > limit) {
        const ttl = await upstash(["PTTL", key]).catch(() => windowMs);
        return { ok: false, remaining: 0, retryAfterMs: ttl > 0 ? ttl : windowMs };
      }
      return { ok: true, remaining: Math.max(0, limit - n), retryAfterMs: 0 };
    } catch {
      // Upstash misconfigured/unreachable → degrade to in-memory (system keeps working)
    }
  }
  return memoryRateLimit(key, limit, windowMs);
}
