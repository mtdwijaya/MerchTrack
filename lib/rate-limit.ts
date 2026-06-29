type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSeconds: number };

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 60_000;

const store = new Map<string, RateLimitEntry>();

function pruneExpired(now: number) {
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

// sliding window sederhana per key (biasanya IP) — cukup untuk single-instance
export function consumeRateLimit(
  key: string,
  {
    limit = LOGIN_LIMIT,
    windowMs = LOGIN_WINDOW_MS,
  }: { limit?: number; windowMs?: number } = {}
): RateLimitResult {
  const now = Date.now();
  pruneExpired(now);

  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  return { ok: true, remaining: limit - entry.count };
}

export function resetRateLimit(key: string) {
  store.delete(key);
}

export function loginRateLimitKey(ip: string) {
  return `login:${ip}`;
}

export const LOGIN_RATE_LIMIT = {
  limit: LOGIN_LIMIT,
  windowMs: LOGIN_WINDOW_MS,
} as const;
