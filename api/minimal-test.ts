import { Hono } from 'hono';
import { handle } from 'hono/vercel';

const app = new Hono().basePath('/api');

app.get('/health', (c) => c.json({ ok: true, time: Date.now() }));

const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
