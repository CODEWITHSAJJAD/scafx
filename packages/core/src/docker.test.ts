import { describe, expect, it } from 'vitest';
import { generateProjectDocker, getStandaloneDockerfile } from './docker.js';
import type { Answer } from './schema/answer.js';

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
    const answer: Answer = {
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
    };

    const ops = generateProjectDocker(answer);
    expect(ops.some((op) => op.path === 'frontend/Dockerfile')).toBe(true);
    expect(ops.some((op) => op.path === 'backend/Dockerfile')).toBe(true);
    expect(ops.some((op) => op.path === 'docker-compose.yml')).toBe(true);

    const compose = ops.find((op) => op.path === 'docker-compose.yml')!.content;
    expect(compose).toContain('backend:');
    expect(compose).toContain('frontend:');
    expect(compose).toContain('depends_on:');
  });
});
