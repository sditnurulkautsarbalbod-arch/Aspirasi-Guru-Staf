import { Hono } from 'hono';
import { memoryDb, isNeonConfigured, db } from '../db/index.js';
import { aspirations } from '../db/schema.js';
import { rateLimiter } from '../middleware/rateLimit.js';

const publicApi = new Hono();

// Rate limit: max 5 submissions per 5 minutes per IP
publicApi.post(
  '/aspirations',
  rateLimiter({
    maxRequests: 5,
    windowMs: 5 * 60 * 1000,
    message: 'Pengiriman terlalu sering. Silakan coba kembali beberapa saat lagi.',
  }),
  async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      let message = (body.message || '').toString();

      // Trim whitespace
      message = message.trim();

      // Validation
      if (!message || message.length === 0) {
        return c.json({ success: false, error: 'Isi aspirasi tidak boleh kosong.' }, 400);
      }

      if (message.length < 10) {
        return c.json({ success: false, error: 'Isi aspirasi terlalu singkat. Minimal 10 karakter.' }, 400);
      }

      if (message.length > 5000) {
        return c.json({ success: false, error: 'Isi aspirasi melebihi batas maksimal 5000 karakter.' }, 400);
      }

      let createdItem: any = null;

      if (isNeonConfigured && db) {
        try {
          const inserted = await db
            .insert(aspirations)
            .values({
              message,
              status: 'BARU',
            })
            .returning();
          createdItem = inserted[0];
        } catch (dbErr) {
          console.error('Neon DB insert error, falling back to memoryDb:', dbErr);
          createdItem = await memoryDb.createAspiration(message);
        }
      } else {
        createdItem = await memoryDb.createAspiration(message);
      }

      return c.json(
        {
          success: true,
          message: 'Aspirasi Anda berhasil dikirim.',
          data: {
            id: createdItem.id,
            status: createdItem.status,
            created_at: createdItem.created_at,
          },
        },
        201
      );
    } catch (err: any) {
      console.error('Submit aspiration error:', err);
      return c.json(
        {
          success: false,
          error: 'Maaf, aspirasi belum dapat dikirim. Silakan coba kembali beberapa saat lagi.',
        },
        500
      );
    }
  }
);

publicApi.get('/health', (c) => {
  return c.json({ status: 'ok', time: new Date().toISOString() });
});

export default publicApi;
