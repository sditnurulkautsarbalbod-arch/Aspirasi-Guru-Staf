import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SESSION_SECRET || 'sdit_nurul_kautsar_internal_aspirasi_secret_key_2026';

export interface JwtPayload {
  id: number;
  name: string;
  username: string;
  role: string;
  is_super_admin: boolean;
}

export type Env = {
  Variables: {
    user: JwtPayload;
  };
};

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, SECRET_KEY) as JwtPayload;
  } catch (err) {
    return null;
  }
}

export function getTokenFromContext(c: Context): string | null {
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  // Check cookie as fallback
  const cookieHeader = c.req.header('Cookie');
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((cookie) => {
        const [key, value] = cookie.trim().split('=');
        return [key, decodeURIComponent(value || '')];
      })
    );
    if (cookies.token) {
      return cookies.token;
    }
  }
  return null;
}

export async function authMiddleware(c: Context, next: Next) {
  const token = getTokenFromContext(c);
  if (!token) {
    return c.json({ success: false, error: 'Akses ditolak. Silakan login terlebih dahulu.' }, 401);
  }

  const payload = verifyToken(token);
  if (!payload) {
    return c.json({ success: false, error: 'Sesi telah berakhir atau tidak valid. Silakan login kembali.' }, 401);
  }

  c.set('user', payload);
  await next();
}

export function requireRole(allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as JwtPayload | undefined;
    if (!user) {
      return c.json({ success: false, error: 'Akses ditolak.' }, 401);
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json({ success: false, error: 'Akses terlarang. Anda tidak memiliki izin untuk halaman ini.' }, 403);
    }

    await next();
  };
}
