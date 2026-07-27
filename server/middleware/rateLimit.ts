import { Context, Next } from 'hono';

// Simple in-memory rate limiter per IP / identifier with TTL cleaning
const requestTracker = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(options: { maxRequests: number; windowMs: number; message?: string }) {
  const { maxRequests, windowMs, message } = options;

  return async (c: Context, next: Next) => {
    // Clean up expired entries periodically
    const now = Date.now();
    if (requestTracker.size > 500) {
      for (const [key, record] of requestTracker.entries()) {
        if (record.resetTime < now) {
          requestTracker.delete(key);
        }
      }
    }

    // Client IP detection (X-Forwarded-For, X-Real-IP, or default fallback)
    const clientIp =
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
      c.req.header('x-real-ip') ||
      'unknown-client';

    const pathKey = `${clientIp}:${c.req.path}`;
    const record = requestTracker.get(pathKey);

    if (!record || record.resetTime < now) {
      requestTracker.set(pathKey, {
        count: 1,
        resetTime: now + windowMs,
      });
    } else {
      record.count++;
      if (record.count > maxRequests) {
        return c.json(
          {
            success: false,
            error: message || 'Pengiriman terlalu sering. Silakan coba kembali beberapa saat lagi.',
          },
          429
        );
      }
    }

    await next();
  };
}
