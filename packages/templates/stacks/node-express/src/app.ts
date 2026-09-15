import cors from 'cors';
import express, { type Express } from 'express';
import { apiRouter } from './routes/index.js';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use('/api', apiRouter);
  app.use(apiRouter);

  return app;
}
