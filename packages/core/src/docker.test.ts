import { describe, expect, it } from 'vitest';
import { generateProjectDocker, getStandaloneDockerfile } from './docker.js';
import { AnswerSchema } from './schema/answer.js';

describe('Docker extra generator in core', () => {
  it('generates Node.js Dockerfile with builder and runner stages', () => {
    const dockerfile = getStandaloneDockerfile('node', 'express', 'my-express-app');
    expect(dockerfile).toContain('FROM node:20-alpine AS builder');
    expect(dockerfile).toContain('FROM node:20-alpine AS runner');
    expect(dockerfile).toContain('CMD ["node", "dist/index.js"]');
  });

  it('generates NestJS Dockerfile targeting dist/main.js', () => {
    const dockerfile = getStandaloneDockerfile('node', 'nestjs', 'my-nest-app');
    expect(dockerfile).toContain('CMD ["node", "dist/main.js"]');
  });

  it('generates Python FastAPI Dockerfile with uvicorn start command', () => {
    const dockerfile = getStandaloneDockerfile('python', 'fastapi', 'my-fastapi-app');
    expect(dockerfile).toContain('FROM python:3.11-slim');
    expect(dockerfile).toContain('uvicorn');
    expect(dockerfile).toContain('src.app.main:app');
  });

  it('.NET Web API Dockerfile with SDK build and ASP.NET runtime', () => {
    const dockerfile = getStandaloneDockerfile('dotnet', 'webapi', 'MyDotnetApi');
    expect(dockerfile).toContain('FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build');
    expect(dockerfile).toContain('FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime');
    expect(dockerfile).toContain('ENTRYPOINT ["dotnet", "MyDotnetApi.dll"]');
  });

  it('generates fullstack Docker configuration with frontend and backend services', () => {
    const answer = AnswerSchema.parse({
      projectName: 'my-fullstack-app',
      stack: 'react',
      framework: 'vite',
      appShape: 'fullstack',
      architecture: 'modular-monolith',
      database: 'postgres',
      orm: 'sqlalchemy',
      extras: ['docker', 'ci'],
      frontend: { stack: 'react', framework: 'vite' },
      backend: { stack: 'python', framework: 'fastapi' },
    });

    const ops = generateProjectDocker(answer);
    expect(ops.some((op) => op.path === 'frontend/Dockerfile')).toBe(true);
    expect(ops.some((op) => op.path === 'backend/Dockerfile')).toBe(true);
    expect(ops.some((op) => op.path === 'docker-compose.yml')).toBe(true);

    const compose = ops.find((op) => op.path === 'docker-compose.yml')!.content;
    expect(compose).toContain('backend:');
    expect(compose).toContain('frontend:');
    expect(compose).toContain('depends_on:');
  });

  it('generates microservices Docker configuration with gateway, downstream services, databases, and bridge network', () => {
    const answer = AnswerSchema.parse({
      projectName: 'ledger-pos',
      stack: 'node',
      framework: 'express',
      appShape: 'microservices',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
      extras: ['docker', 'ci'],
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
          stack: 'dotnet',
          framework: 'webapi',
          port: 8003,
          database: 'none',
          orm: 'none',
          extras: [],
        },
      ],
    });

    const ops = generateProjectDocker(answer);

    // Dockerfiles per service & gateway
    expect(ops.some((op) => op.path === 'gateway/Dockerfile')).toBe(true);
    expect(ops.some((op) => op.path === 'gateway/.dockerignore')).toBe(true);
    expect(ops.some((op) => op.path === 'services/auth-service/Dockerfile')).toBe(true);
    expect(ops.some((op) => op.path === 'services/auth-service/.dockerignore')).toBe(true);
    expect(ops.some((op) => op.path === 'services/catalog-service/Dockerfile')).toBe(true);
    expect(ops.some((op) => op.path === 'services/catalog-service/.dockerignore')).toBe(true);
    expect(ops.some((op) => op.path === 'services/inventory-service/Dockerfile')).toBe(true);
    expect(ops.some((op) => op.path === 'services/inventory-service/.dockerignore')).toBe(true);
    expect(ops.some((op) => op.path === 'docker-compose.yml')).toBe(true);
    expect(ops.some((op) => op.path === '.dockerignore')).toBe(true);

    const compose = ops.find((op) => op.path === 'docker-compose.yml')!.content;

    // Database services with healthchecks
    expect(compose).toContain('postgres:');
    expect(compose).toContain('image: postgres:16-alpine');
    expect(compose).toContain('pg_isready -U postgres');
    expect(compose).toContain('mongodb:');
    expect(compose).toContain('image: mongo:7-jammy');
    expect(compose).toContain("db.adminCommand('ping')");

    // Downstream services with network, ports, dependencies & env
    expect(compose).toContain('auth-service:');
    expect(compose).toContain('context: ./services/auth-service');
    expect(compose).toContain("'8001:8001'");
    expect(compose).toContain('postgres:\n        condition: service_healthy');
    expect(compose).toContain(
      'DATABASE_URL=postgresql://postgres:postgres@postgres:5432/auth_service_db',
    );

    expect(compose).toContain('catalog-service:');
    expect(compose).toContain('context: ./services/catalog-service');
    expect(compose).toContain("'8002:8002'");
    expect(compose).toContain('AUTH_SERVICE_URL=http://auth-service:8001');
    expect(compose).toContain('mongodb:\n        condition: service_healthy');
    expect(compose).toContain('MONGODB_URI=mongodb://mongodb:27017/catalog_service_db');

    expect(compose).toContain('inventory-service:');
    expect(compose).toContain('context: ./services/inventory-service');
    expect(compose).toContain("'8003:8003'");
    expect(compose).toContain('AUTH_SERVICE_URL=http://auth-service:8001');

    // Gateway service
    expect(compose).toContain('gateway:');
    expect(compose).toContain('context: ./gateway');
    expect(compose).toContain("'8000:8000'");
    expect(compose).toContain('AUTH_SERVICE_URL=http://auth-service:8001');
    expect(compose).toContain('CATALOG_SERVICE_URL=http://catalog-service:8002');
    expect(compose).toContain('INVENTORY_SERVICE_URL=http://inventory-service:8003');

    // Bridge network & volumes
    expect(compose).toContain('microservices-net:');
    expect(compose).toContain('driver: bridge');
    expect(compose).toContain('volumes:\n  postgres-data:\n  mongo-data:');
  });
});
