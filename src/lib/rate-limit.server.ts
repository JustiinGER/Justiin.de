/**
 * Small in-memory failure counter — server-only.
 * State is per process and resets on restart.
 */

interface Entry {
  attempts: number;
  firstAttempt: number;
}

export interface RateLimiter {
  /** Returns whether another attempt is allowed for this key. */
  check(key: string): { allowed: boolean; retryAfterSeconds?: number };
  recordFailure(key: string): void;
  reset(key: string): void;
}

export function createRateLimiter(options: {
  windowMs: number;
  maxAttempts: number;
  /** Upper bound on tracked keys so spoofed keys cannot grow the map forever. */
  maxEntries?: number;
}): RateLimiter {
  const { windowMs, maxAttempts, maxEntries = 5000 } = options;
  const entries = new Map<string, Entry>();

  function prune(now: number): void {
    for (const [key, entry] of entries) {
      if (now - entry.firstAttempt > windowMs) entries.delete(key);
    }
    // Still full of live entries: drop the oldest ones (Map keeps insertion order).
    for (const key of entries.keys()) {
      if (entries.size < maxEntries) break;
      entries.delete(key);
    }
  }

  return {
    check(key) {
      const now = Date.now();
      const entry = entries.get(key);
      if (!entry) return { allowed: true };

      if (now - entry.firstAttempt > windowMs) {
        entries.delete(key);
        return { allowed: true };
      }

      if (entry.attempts >= maxAttempts) {
        return {
          allowed: false,
          retryAfterSeconds: Math.ceil((entry.firstAttempt + windowMs - now) / 1000),
        };
      }

      return { allowed: true };
    },

    recordFailure(key) {
      const now = Date.now();
      const entry = entries.get(key);
      if (entry && now - entry.firstAttempt <= windowMs) {
        entry.attempts++;
        return;
      }
      if (entries.size >= maxEntries) prune(now);
      entries.set(key, { attempts: 1, firstAttempt: now });
    },

    reset(key) {
      entries.delete(key);
    },
  };
}

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/**
 * Guards re-authentication prompts (password change, env editor) so a stolen
 * session cannot be used to guess the account password.
 */
export const passwordConfirmLimiter = createRateLimiter({
  windowMs: FIFTEEN_MINUTES,
  maxAttempts: 5,
});
