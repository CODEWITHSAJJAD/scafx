import { AnswerSchema, generate, type Answer } from '@codewithsajjad01/core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { FsTemplateSource } from './loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Microservice Service Template Composition & Auth Inter-service Wiring', () => {
  const templatesDir = path.resolve(__dirname, '..');
  const templateSource = new FsTemplateSource(templatesDir);

  it('composes a multi-stack microservices architecture with isolated services and inter-service auth wiring', async () => {
    const answer = AnswerSchema.parse({
      projectName: 'enterprise-pos',
      stack: 'node',
      framework: 'express',
      appShape: 'microservices',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
      extras: ['env', 'docker', 'ci'],
      gateway: {
        stack: 'node',
        framework: 'express',
        port: 8000,
      },
      services: [
        {
          name: 'auth-service',
          stack: 'node',
          framework: 'express',
          port: 8001,
          database: 'postgres',
          orm: 'prisma',
          extras: ['auth'],
        },
        {
          name: 'catalog-service',
          stack: 'python',
          framework: 'fastapi',
          port: 8002,
          database: 'mongodb',
          orm: 'motor',
          extras: [],
        },
        {
          name: 'inventory-service',
          stack: 'node',
          framework: 'fastify',
          port: 8003,
          database: 'sqlite',
          orm: 'prisma',
          extras: [],
        },
        {
          name: 'order-service',
          stack: 'python',
          framework: 'flask',
          port: 8004,
          database: 'none',
          orm: 'none',
          extras: [],
        },
      ],
    });

    const fileOps = await generate(answer, templateSource);
    expect(fileOps.length).toBeGreaterThan(0);

    const paths = fileOps.map((f) => f.path);

    // 1. Gateway verification
    expect(paths).toContain('gateway/package.json');
    expect(paths).toContain('gateway/tsconfig.json');
    expect(paths).toContain('gateway/src/index.ts');
    expect(paths).toContain('gateway/.env.example');

    // 2. Auth Service (Node + Express + Prisma + Postgres + JWT)
    expect(paths).toContain('services/auth-service/package.json');
    expect(paths).toContain('services/auth-service/src/index.ts');
    expect(paths).toContain('services/auth-service/prisma/schema.prisma');
    expect(paths).toContain('services/auth-service/src/auth/jwt.ts');
    expect(paths).toContain('services/auth-service/src/auth/middleware.ts');
    expect(paths).toContain('services/auth-service/src/routes/auth.ts');
    expect(paths).toContain('services/auth-service/.env.example');

    const authEnv = fileOps.find((f) => f.path === 'services/auth-service/.env.example');
    expect(authEnv?.content).toContain('PORT=8001');
    expect(authEnv?.content).toContain('SERVICE_NAME=auth-service');
    expect(authEnv?.content).toContain('JWT_SECRET=');
    expect(authEnv?.content).toContain('DATABASE_URL=');

    // 3. Catalog Service (Python + FastAPI + MongoDB + Motor)
    expect(paths).toContain('services/catalog-service/pyproject.toml');
    expect(paths).toContain('services/catalog-service/src/app/main.py');
    expect(paths).toContain('services/catalog-service/src/app/db/mongo.py');
    expect(paths).toContain('services/catalog-service/src/app/models/user_mongo.py');
    expect(paths).toContain('services/catalog-service/.env.example');

    const catalogEnv = fileOps.find((f) => f.path === 'services/catalog-service/.env.example');
    expect(catalogEnv?.content).toContain('PORT=8002');
    expect(catalogEnv?.content).toContain('SERVICE_NAME=catalog-service');
    expect(catalogEnv?.content).toContain('AUTH_SERVICE_URL=http://localhost:8001');
    expect(catalogEnv?.content).toContain('MONGODB_URI=');

    // 4. Inventory Service (Node + Fastify + SQLite + Prisma)
    expect(paths).toContain('services/inventory-service/package.json');
    expect(paths).toContain('services/inventory-service/src/index.ts');
    expect(paths).toContain('services/inventory-service/prisma/schema.prisma');
    expect(paths).toContain('services/inventory-service/.env.example');

    const inventoryEnv = fileOps.find((f) => f.path === 'services/inventory-service/.env.example');
    expect(inventoryEnv?.content).toContain('PORT=8003');
    expect(inventoryEnv?.content).toContain('SERVICE_NAME=inventory-service');
    expect(inventoryEnv?.content).toContain('AUTH_SERVICE_URL=http://localhost:8001');
    expect(inventoryEnv?.content).toContain('DATABASE_URL=');

    // 5. Order Service (Python + Flask)
    expect(paths).toContain('services/order-service/requirements.txt');
    expect(paths).toContain('services/order-service/src/app/__init__.py');
    expect(paths).toContain('services/order-service/.env.example');

    const orderEnv = fileOps.find((f) => f.path === 'services/order-service/.env.example');
    expect(orderEnv?.content).toContain('PORT=8004');
    expect(orderEnv?.content).toContain('SERVICE_NAME=order-service');

    // 6. Root configs
    expect(paths).toContain('.env.example');
    expect(paths).toContain('README.md');

    const rootEnv = fileOps.find((f) => f.path === '.env.example');
    expect(rootEnv?.content).toContain('GATEWAY_PORT=8000');
    expect(rootEnv?.content).toContain('AUTH_SERVICE_URL=http://localhost:8001');
    expect(rootEnv?.content).toContain('CATALOG_SERVICE_URL=http://localhost:8002');
    expect(rootEnv?.content).toContain('INVENTORY_SERVICE_URL=http://localhost:8003');
    expect(rootEnv?.content).toContain('ORDER_SERVICE_URL=http://localhost:8004');

    const readme = fileOps.find((f) => f.path === 'README.md');
    expect(readme?.content).toContain('### Microservices Architecture');
    expect(readme?.content).toContain('auth-service');
    expect(readme?.content).toContain('catalog-service');
    expect(readme?.content).toContain('inventory-service');
    expect(readme?.content).toContain('order-service');
  });
});
