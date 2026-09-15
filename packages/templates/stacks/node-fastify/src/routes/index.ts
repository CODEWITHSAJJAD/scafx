import type { FastifyPluginAsync } from 'fastify';
import { healthRoutes } from './health.js';

export const apiRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(healthRoutes);

  fastify.get('/', async (_request, _reply) => {
    return {
      message: 'Welcome to {{projectName}} API',
      stack: '{{stack}}',
      framework: '{{framework}}',
    };
  });
};
