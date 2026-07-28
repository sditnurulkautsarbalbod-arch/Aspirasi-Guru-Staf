// Test: default export (Node.js req/res style) for catch-all
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    method: req.method,
    url: req.url,
    path: req.query.path || [],
  });
}
