import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import app from './server/index';

async function startServer() {
  const server = express();
  const PORT = 3000;

  server.use(express.json());

  // Mount Hono API app handler for /api requests
  server.all('/api*', async (req, res) => {
    try {
      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:3000';
      const fullUrl = `${protocol}://${host}${req.originalUrl}`;

      const headers = new Headers();
      for (const [key, val] of Object.entries(req.headers)) {
        if (Array.isArray(val)) {
          val.forEach((v) => headers.append(key, v));
        } else if (val) {
          headers.append(key, val);
        }
      }

      let body: any = undefined;
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.body) {
        body = JSON.stringify(req.body);
      }

      const fetchReq = new Request(fullUrl, {
        method: req.method,
        headers,
        body,
      });

      const response = await app.fetch(fetchReq);

      res.status(response.status);
      response.headers.forEach((val, key) => {
        res.setHeader(key, val);
      });

      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (err) {
      console.error('Express-Hono bridge error:', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    server.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    server.use(express.static(distPath));
    server.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
