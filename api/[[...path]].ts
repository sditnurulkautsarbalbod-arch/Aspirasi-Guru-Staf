import { handle } from 'hono/vercel';
import app from '../server/index';

// Wrap with try-catch so Vercel can surface startup errors
export default handle(app);
