import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getRequestListener } from '@hono/node-server';
import app from './server/index.js';

async function startServer() {
  const server = express();
  const PORT = 3000;

  // Hono API request listener handling all /api requests
  const listener = getRequestListener(app.fetch);
  server.use((req, res, next) => {
    if (req.url && (req.url === '/api' || req.url.startsWith('/api/'))) {
      return listener(req, res);
    }
    next();
  });

  server.use(express.json());

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
