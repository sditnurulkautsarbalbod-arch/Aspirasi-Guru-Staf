import { handle } from 'hono/vercel';
import app from '../server/index';

const handler = handle(app);

export default async function (req: Request, ctx: unknown) {
  try {
    return await handler(req);
  } catch (err: any) {
    console.error('Vercel handler error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
