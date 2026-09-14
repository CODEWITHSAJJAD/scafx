import { DiskFileWriter, generate, type Answer } from '@scafx/core';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FsTemplateSource } from './loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Docker & CI Workflow Generator Extras Smoke Test', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'docker-ci-extras-smoke-'));
  });

  afterAll(async () => {
    await fs.remove(tempDir);
  });

  it('scaffolds standalone Fastify project with Docker & CI workflow extras', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);
    const targetDir = path.join(tempDir, 'fastify-docker-ci-app');
    await fs.ensureDir(targetDir);

    const answer: Answer = {
      projectName: 'fastify-docker-ci-app',
      stack: 'node',
      framework: 'fastify',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'postgres',
      orm: 'prisma',
      extras: ['docker', 'ci', 'env', 'git'],
    };

    const fileOps = await generate(answer, templateSource);
    expect(fileOps.length).toBeGreaterThan(0);

    const writer = new DiskFileWriter();
    await writer.write(targetDir, fileOps);

    // 1. Verify Dockerfile
    expect(await fs.pathExists(path.join(targetDir, 'Dockerfile'))).toBe(true);
    const dockerfile = await fs.readFile(path.join(targetDir, 'Dockerfile'), 'utf-8');
    expect(dockerfile).toContain('FROM node:20-alpine AS builder');
    expect(dockerfile).toContain('FROM node:20-alpine AS runner');
    expect(dockerfile).toContain('CMD ["node", "dist/index.js"]');

    // 2. Verify .dockerignore
    expect(await fs.pathExists(path.join(targetDir, '.dockerignore'))).toBe(true);
    const dockerignore = await fs.readFile(path.join(targetDir, '.dockerignore'), 'utf-8');
    expect(dockerignore).toContain('node_modules');
    expect(dockerignore).toContain('dist');

    // 3. Verify docker-compose.yml
    expect(await fs.pathExists(path.join(targetDir, 'docker-compose.yml'))).toBe(true);
    const compose = await fs.readFile(path.join(targetDir, 'docker-compose.yml'), 'utf-8');
    expect(compose).toContain('container_name:');
    expect(compose).toContain('fastify-docker-ci-app');

    // 4. Verify GitHub Actions CI workflow
    expect(await fs.pathExists(path.join(targetDir, '.github/workflows/ci.yml'))).toBe(true);
    const ciWorkflow = await fs.readFile(path.join(targetDir, '.github/workflows/ci.yml'), 'utf-8');
    expect(ciWorkflow).toContain('name: CI');
    expect(ciWorkflow).toContain('Setup Node.js 20.x');
    expect(ciWorkflow).toContain('npm ci');
  });

  it('scaffolds fullstack React + FastAPI project with Docker & CI workflow extras', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);
    const targetDir = path.join(tempDir, 'fullstack-docker-ci-app');
    await fs.ensureDir(targetDir);

    const answer: Answer = {
      projectName: 'fullstack-docker-ci-app',
      stack: 'react',
      framework: 'vite',
      appShape: 'fullstack',
      architecture: 'modular-monolith',
      database: 'postgres',
      orm: 'sqlalchemy',
      extras: ['docker', 'ci', 'env', 'git'],
      frontend: { stack: 'react', framework: 'vite' },
      backend: { stack: 'python', framework: 'fastapi' },
    };

    const fileOps = await generate(answer, templateSource);
    expect(fileOps.length).toBeGreaterThan(0);

    const writer = new DiskFileWriter();
    await writer.write(targetDir, fileOps);

    // 1. Verify frontend and backend Dockerfiles
    expect(await fs.pathExists(path.join(targetDir, 'frontend/Dockerfile'))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, 'backend/Dockerfile'))).toBe(true);

    const frontendDocker = await fs.readFile(path.join(targetDir, 'frontend/Dockerfile'), 'utf-8');
    expect(frontendDocker).toContain('nginx:alpine');

    const backendDocker = await fs.readFile(path.join(targetDir, 'backend/Dockerfile'), 'utf-8');
    expect(backendDocker).toContain('FROM python:3.11-slim');
    expect(backendDocker).toContain('uvicorn');

    // 2. Verify root docker-compose.yml
    expect(await fs.pathExists(path.join(targetDir, 'docker-compose.yml'))).toBe(true);
    const compose = await fs.readFile(path.join(targetDir, 'docker-compose.yml'), 'utf-8');
    expect(compose).toContain('backend:');
    expect(compose).toContain('frontend:');

    // 3. Verify root CI workflow
    expect(await fs.pathExists(path.join(targetDir, '.github/workflows/ci.yml'))).toBe(true);
    const ci = await fs.readFile(path.join(targetDir, '.github/workflows/ci.yml'), 'utf-8');
    expect(ci).toContain('test-backend:');
    expect(ci).toContain('test-frontend:');
  });

  it('scaffolds microservices project with Docker & CI workflow extras', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);
    const targetDir = path.join(tempDir, 'microservices-docker-ci-app');
    await fs.ensureDir(targetDir);

    const answer: Answer = {
      projectName: 'microservices-docker-ci-app',
      stack: 'node',
      framework: 'express',
      appShape: 'microservices',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
      extras: ['docker', 'ci', 'env', 'git'],
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
      ],
    };

    const fileOps = await generate(answer, templateSource);
    expect(fileOps.length).toBeGreaterThan(0);

    const writer = new DiskFileWriter();
    await writer.write(targetDir, fileOps);

    // 1. Verify Dockerfiles
    expect(await fs.pathExists(path.join(targetDir, 'gateway/Dockerfile'))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, 'services/auth-service/Dockerfile'))).toBe(
      true,
    );
    expect(await fs.pathExists(path.join(targetDir, 'services/catalog-service/Dockerfile'))).toBe(
      true,
    );

    // 2. Verify docker-compose.yml
    expect(await fs.pathExists(path.join(targetDir, 'docker-compose.yml'))).toBe(true);
    const compose = await fs.readFile(path.join(targetDir, 'docker-compose.yml'), 'utf-8');
    expect(compose).toContain('gateway:');
    expect(compose).toContain('auth-service:');
    expect(compose).toContain('catalog-service:');
    expect(compose).toContain('postgres:');
    expect(compose).toContain('mongodb:');
    expect(compose).toContain('microservices-net:');
  });
});
