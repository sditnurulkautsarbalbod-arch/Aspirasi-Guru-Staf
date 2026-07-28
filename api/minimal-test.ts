import { Hono } from 'hono';
import { handle } from 'hono/vercel';

const app = new Hono().basePath('/api');

app.get('/health', (c) => c.json({ ok: true, time: Date.now() }));

export default handle(app);
