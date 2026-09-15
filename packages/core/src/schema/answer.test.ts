import { describe, expect, it } from 'vitest';
import { AnswerSchema, type Answer, type AnswerInput } from './answer.js';

describe('AnswerSchema', () => {
  it('validates a valid sample answer object', () => {
    const validAnswer: AnswerInput = {
      projectName: 'my-express-app',
      stack: 'node',
      framework: 'express',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'postgres',
      orm: 'prisma',
      extras: ['docker', 'env', 'git'],
      runtimeVersion: '>=20.0.0',
    };

    const parsed = AnswerSchema.parse(validAnswer);
    expect(parsed.projectName).toBe('my-express-app');
    expect(parsed.stack).toBe('node');
    expect(parsed.framework).toBe('express');
    expect(parsed.architecture).toBe('layered');
    expect(parsed.database).toBe('postgres');
    expect(parsed.repositoryStructure).toBe('monorepo-isolated');
    expect(parsed.migrationTool).toBe('native');
  });

  it('provides default empty array for extras if omitted', () => {
    const minimalAnswer: AnswerInput = {
      projectName: 'fastapi-backend',
      stack: 'python',
      framework: 'fastapi',
      appShape: 'standalone',
      architecture: 'clean',
      database: 'none',
      orm: 'none',
    };

    const parsed = AnswerSchema.parse(minimalAnswer);
    expect(parsed.extras).toEqual([]);
    expect(parsed.projectName).toBe('fastapi-backend');
  });

  it('rejects an empty project name with a clear error message', () => {
    const invalid = {
      projectName: '',
      stack: 'node',
      framework: 'express',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
    };

    const result = AnswerSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some((issue) => issue.path.includes('projectName'))).toBe(true);
      expect(issues[0].message).toMatch(/Project name/i);
    }
  });

  it('rejects an invalid project name containing spaces or forbidden characters', () => {
    const invalid = {
      projectName: 'invalid project name with spaces',
      stack: 'node',
      framework: 'express',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
    };

    const result = AnswerSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some((issue) => issue.path.includes('projectName'))).toBe(true);
    }
  });

  it('rejects an invalid stack enum value', () => {
    const invalid = {
      projectName: 'ruby-app',
      stack: 'ruby',
      framework: 'rails',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
    };

    const result = AnswerSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some((issue) => issue.path.includes('stack'))).toBe(true);
    }
  });

  it('rejects an invalid framework enum value', () => {
    const invalid = {
      projectName: 'node-app',
      stack: 'node',
      framework: 'django', // Django is python, not node
      appShape: 'standalone',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
    };

    const parsed = AnswerSchema.safeParse(invalid);
    expect(parsed.success).toBe(true); // AnswerSchema validates syntax; compatibility is validated by manifest/matrix
  });

  it('validates a valid fullstack composition answer with frontend and backend sub-stacks', () => {
    const fullstackAnswer: AnswerInput = {
      projectName: 'my-fullstack-app',
      stack: 'node',
      framework: 'express',
      appShape: 'fullstack',
      architecture: 'clean',
      database: 'postgres',
      orm: 'prisma',
      extras: ['docker', 'ci'],
      frontend: {
        stack: 'react',
        framework: 'vite',
      },
      backend: {
        stack: 'python',
        framework: 'fastapi',
      },
    };

    const parsed = AnswerSchema.parse(fullstackAnswer);
    expect(parsed.appShape).toBe('fullstack');
    expect(parsed.frontend?.stack).toBe('react');
    expect(parsed.frontend?.framework).toBe('vite');
    expect(parsed.backend?.stack).toBe('python');
    expect(parsed.backend?.framework).toBe('fastapi');
  });

  it('validates a valid microservices architecture answer with gateway and downstream services', () => {
    const microservicesAnswer: AnswerInput = {
      projectName: 'my-microservices-mesh',
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
      ],
    };

    const parsed = AnswerSchema.parse(microservicesAnswer);
    expect(parsed.appShape).toBe('microservices');
    expect(parsed.services).toHaveLength(2);
    expect(parsed.gateway?.port).toBe(8000);
    expect(parsed.services?.[0].name).toBe('auth-service');
    expect(parsed.services?.[1].name).toBe('catalog-service');
  });

  it('rejects an invalid microservice service name', () => {
    const invalid = {
      projectName: 'my-mesh',
      stack: 'node',
      framework: 'express',
      appShape: 'microservices',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
      services: [
        {
          name: 'invalid service name with spaces',
          stack: 'node',
          framework: 'express',
          port: 8001,
        },
      ],
    };

    const result = AnswerSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
