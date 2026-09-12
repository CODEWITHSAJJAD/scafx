import { Router } from 'express';
import { healthRouter } from './health.js';

export const apiRouter = Router();

apiRouter.use(healthRouter);

apiRouter.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to {{projectName}} API',
    stack: '{{stack}}',
    framework: '{{framework}}',
  });
});
