/**
 * B People — Rate Limiter
 * In-memory sliding window rate limiting.
 * Replace with Upstash Redis in production.
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 60_000; // 1 min

// Periodic cleanup of expired entries
if (typeof setInterval !== "undefined") {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store) {
            if (entry.resetAt <= now) store.delete(key);
        }
    }, CLEANUP_INTERVAL);
}

export interface RateLimitConfig {
    /** Max requests per window */
    limit: number;
    /** Window duration in milliseconds */
    windowMs: number;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfterMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
    limit: 60,
    windowMs: 60_000, // 60 req/min
};

export function rateLimit(
    key: string,
    config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitResult {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
        // New window
        store.set(key, { count: 1, resetAt: now + config.windowMs });
        return {
            allowed: true,
            remaining: config.limit - 1,
            resetAt: now + config.windowMs,
            retryAfterMs: 0,
        };
    }

    if (entry.count >= config.limit) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: entry.resetAt,
            retryAfterMs: entry.resetAt - now,
        };
    }

    entry.count++;
    return {
        allowed: true,
        remaining: config.limit - entry.count,
        resetAt: entry.resetAt,
        retryAfterMs: 0,
    };
}

// Preset configs
export const RATE_LIMITS = {
    auth: { limit: 10, windowMs: 900_000 },     // 10 req / 15 min
    api: { limit: 100, windowMs: 60_000 },       // 100 req / min
    export: { limit: 20, windowMs: 300_000 },    // 20 req / 5 min
    webhook: { limit: 50, windowMs: 60_000 },    // 50 req / min
} satisfies Record<string, RateLimitConfig>;
