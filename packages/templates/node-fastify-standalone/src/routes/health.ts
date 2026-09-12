import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (_request, _reply) => {
    return {
      status: 'ok',
      service: '{{projectName}}',
      timestamp: new Date().toISOString(),
    };
  });
};
