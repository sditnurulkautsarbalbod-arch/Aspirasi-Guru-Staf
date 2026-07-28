import { handle } from 'hono/vercel';

// server-bundle.mjs exports the Hono app (with basePath('/api') + all routes)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - bundled ESM module with default export
import app from './server-bundle.mjs';

const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
