import { headers } from "next/headers"

interface RateLimitRecord {
    attempts: number
    firstAttemptTime: number
    lockedUntil: number
}

// In-memory store (sliding window / lockout)
const store = new Map<string, RateLimitRecord>()

// Clean up old entries every 10 minutes to prevent memory leak
if (typeof setInterval !== "undefined") {
    setInterval(() => {
        const now = Date.now()
        for (const [key, record] of store.entries()) {
            if (now > record.lockedUntil && now - record.firstAttemptTime > 60 * 60 * 1000) {
                store.delete(key)
            }
        }
    }, 10 * 60 * 1000)
}

export interface RateLimitOptions {
    maxAttempts: number        // e.g. 5 attempts
    windowMs: number           // e.g. 15 minutes window
    lockoutDurationMs: number  // e.g. 15 minutes lockout if exceeded
}

export const LOGIN_RATE_LIMIT_OPTIONS: RateLimitOptions = {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,          // 15 minutes
    lockoutDurationMs: 15 * 60 * 1000, // 15 minutes lockout
}

/**
 * Checks if a key (IP or username) is currently rate-limited.
 */
export function checkRateLimit(key: string, options: RateLimitOptions = LOGIN_RATE_LIMIT_OPTIONS): {
    allowed: boolean
    remainingAttempts: number
    retryAfterSeconds: number
} {
    const now = Date.now()
    const record = store.get(key)

    if (!record) {
        return { allowed: true, remainingAttempts: options.maxAttempts, retryAfterSeconds: 0 }
    }

    // Currently locked out?
    if (record.lockedUntil > now) {
        const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000)
        return { allowed: false, remainingAttempts: 0, retryAfterSeconds }
    }

    // Window expired?
    if (now - record.firstAttemptTime > options.windowMs) {
        store.delete(key)
        return { allowed: true, remainingAttempts: options.maxAttempts, retryAfterSeconds: 0 }
    }

    const remainingAttempts = Math.max(0, options.maxAttempts - record.attempts)
    return { allowed: remainingAttempts > 0, remainingAttempts, retryAfterSeconds: 0 }
}

/**
 * Records a failed attempt for a key. If max attempts are reached, locks out the key.
 */
export function recordFailedAttempt(key: string, options: RateLimitOptions = LOGIN_RATE_LIMIT_OPTIONS): {
    isLocked: boolean
    remainingAttempts: number
    retryAfterSeconds: number
} {
    const now = Date.now()
    let record = store.get(key)

    if (!record || (now - record.firstAttemptTime > options.windowMs && record.lockedUntil <= now)) {
        record = {
            attempts: 1,
            firstAttemptTime: now,
            lockedUntil: 0
        }
    } else {
        record.attempts += 1
    }

    if (record.attempts >= options.maxAttempts) {
        record.lockedUntil = now + options.lockoutDurationMs
        store.set(key, record)
        const retryAfterSeconds = Math.ceil(options.lockoutDurationMs / 1000)
        return { isLocked: true, remainingAttempts: 0, retryAfterSeconds }
    }

    store.set(key, record)
    const remainingAttempts = Math.max(0, options.maxAttempts - record.attempts)
    return { isLocked: false, remainingAttempts, retryAfterSeconds: 0 }
}

/**
 * Resets rate limit record (e.g. after successful login).
 */
export function resetRateLimit(key: string): void {
    store.delete(key)
}

/**
 * Extracts client IP from request headers.
 */
export async function getClientIp(): Promise<string> {
    try {
        const headerList = await headers()
        const cfConnectingIp = headerList.get("cf-connecting-ip")
        if (cfConnectingIp) return cfConnectingIp.trim()
        const forwardedFor = headerList.get("x-forwarded-for")
        if (forwardedFor) {
            // First IP in list is the original client
            return forwardedFor.split(",")[0].trim()
        }
        const realIp = headerList.get("x-real-ip")
        if (realIp) return realIp.trim()
    } catch {
        // Headers might not be accessible outside of request context
    }
    return "127.0.0.1"
}

/**
 * Helper to extract client IP from a NextRequest / Request object directly.
 */
export function getRequestIp(req: Request): string {
    const cfConnectingIp = req.headers.get("cf-connecting-ip")
    if (cfConnectingIp) return cfConnectingIp.trim()
    const forwardedFor = req.headers.get("x-forwarded-for")
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim()
    }
    const realIp = req.headers.get("x-real-ip")
    if (realIp) return realIp.trim()
    return "127.0.0.1"
}

