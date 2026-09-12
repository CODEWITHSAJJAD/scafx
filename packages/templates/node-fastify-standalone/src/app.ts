import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { apiRoutes } from './routes/index.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  await app.register(cors);
  await app.register(apiRoutes, { prefix: '/api' });
  await app.register(apiRoutes);

  return app;
}
