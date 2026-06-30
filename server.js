import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './backend/routes.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser middleware
  app.use(express.json());

  // API Routes
  app.use('/api', apiRouter);

  // Vite development server middleware OR static file server
  if (process.env.NODE_ENV !== 'production') {
    console.log('Starting server in DEVELOPMENT mode with Vite live reload integration...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Starting server in PRODUCTION mode...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RK Dental Clinical Server is live at http://localhost:${PORT}`);
  });
}

startServer();
