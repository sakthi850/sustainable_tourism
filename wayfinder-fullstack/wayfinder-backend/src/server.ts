import dotenv from 'dotenv';
dotenv.config();

import express, { Express } from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import apiRoutes from './routes/index';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

export function createApp(): Express {
  const app = express();
  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((s) => s.trim());
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

async function main() {
  await connectDB();
  const app = createApp();
  const port = Number(process.env.PORT) || 5000;
  app.listen(port, () => {
    console.log(`🚀 Wayfinder API listening on http://localhost:${port}`);
    console.log(`   Try: curl http://localhost:${port}/api/health`);
  });
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
  });
}
