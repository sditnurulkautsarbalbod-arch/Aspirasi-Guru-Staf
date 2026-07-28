import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { generateToken, authMiddleware, JwtPayload, Env } from '../middleware/auth';
import { memoryDb, isNeonConfigured, db } from '../db/index';
import { users } from '../db/schema';
import { rateLimiter } from '../middleware/rateLimit';

const auth = new Hono<Env>();

// Login rate limited: max 10 attempts per minute
auth.post('/login', rateLimiter({ maxRequests: 10, windowMs: 60 * 1000 }), async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const username = (body.username || '').trim();
    const password = (body.password || '').trim();

    if (!username || !password) {
      return c.json({ success: false, error: 'Username dan password wajib diisi.' }, 400);
    }

    let user: any = null;

    if (isNeonConfigured && db) {
      try {
        const found = await db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);
        if (found.length > 0 && found[0].is_active) {
          user = found[0];
        } else {
          // If user not in Neon DB yet, check memoryDb default accounts
          user = await memoryDb.getUserByUsername(username);
        }
      } catch (dbErr) {
        console.error('Neon DB query error during login, falling back to memoryDb:', dbErr);
        user = await memoryDb.getUserByUsername(username);
      }
    } else {
      user = await memoryDb.getUserByUsername(username);
    }

    if (!user) {
      return c.json({ success: false, error: 'Username atau password tidak sesuai.' }, 401);
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return c.json({ success: false, error: 'Username atau password tidak sesuai.' }, 401);
    }

    const payload: JwtPayload = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      is_super_admin: user.is_super_admin || false,
    };

    const token = generateToken(payload);

    // Audit log
    try {
      await memoryDb.addAuditLog({
        user_id: String(user.id),
        action: 'LOGIN',
        entity: 'USER',
        entity_id: String(user.id),
      });
    } catch (logErr) {
      console.error('Failed to write audit log:', logErr);
    }

    c.header('Set-Cookie', `token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800`);

    return c.json({
      success: true,
      data: {
        token,
        user: payload,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return c.json({ success: false, error: 'Terjadi kesalahan sistem saat memproses login.' }, 500);
  }
});

auth.post('/logout', async (c) => {
  c.header('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=0');
  return c.json({ success: true, message: 'Berhasil keluar.' });
});

auth.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');
  return c.json({ success: true, data: { user } });
});

export default auth;
