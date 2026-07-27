import { Hono } from 'hono';
import { cors } from 'hono/cors';
import publicApi from './routes/public';
import authApi from './routes/auth';
import adminApi from './routes/admin';
import wakasekApi from './routes/wakasek';
import kepalaSekolahApi from './routes/kepalaSekolah';

const app = new Hono().basePath('/api');

// CORS configuration
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  credentials: true,
}));

// Error handler to prevent HTML response returns
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json(
    {
      success: false,
      error: 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.',
    },
    500
  );
});

// Not found handler for /api routes
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Endpoint API tidak ditemukan.',
    },
    404
  );
});

// Register sub-routes
app.route('/', publicApi);
app.route('/auth', authApi);
app.route('/admin', adminApi);
app.route('/wakasek', wakasekApi);
app.route('/kepala-sekolah', kepalaSekolahApi);

export default app;
