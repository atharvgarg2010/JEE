import { RateLimitError } from "./error";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Auto-cleanup expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000).unref(); // unref so it doesn't keep the process alive

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  identifier?: string;
}

export function rateLimit(req: Request, options: RateLimitOptions) {
  const ip = req.headers.get("x-forwarded-for") || "unknown-ip";
  const route = new URL(req.url).pathname;
  const identifier = options.identifier || `${ip}:${route}`;

  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || record.resetTime < now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return;
  }

  record.count += 1;

  if (record.count > options.limit) {
    console.warn(`[Suspicious Activity] Rate limit hit for ${identifier} (Count: ${record.count})`);
    throw new RateLimitError(`Too many requests. Please try again later.`);
  }
}

// Suspicious activity loggers
export function logSuspiciousFailedLogin(identifier: string) {
  console.warn(`[Suspicious Activity] Repeated failed login attempts for: ${identifier}`);
}

export function logSuspiciousForbidden(identifier: string, resource: string) {
  console.warn(`[Suspicious Activity] Repeated 403 Forbidden hits by ${identifier} on ${resource}`);
}
