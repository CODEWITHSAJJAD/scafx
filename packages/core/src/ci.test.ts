import { describe, expect, it } from 'vitest';
import { generateProjectCi, getProjectCiWorkflow } from './ci.js';
import type { Answer } from './schema/answer.js';

describe('CI workflow generator in core', () => {
  it('generates GitHub Actions workflow for Node.js project', () => {
    const answer: Answer = {
      projectName: 'my-node-app',
      stack: 'node',
      framework: 'express',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
      extras: ['ci'],
    };

    const workflow = getProjectCiWorkflow(answer);
    expect(workflow).toContain('name: CI');
    expect(workflow).toContain('Setup Node.js 20.x');
    expect(workflow).toContain('npm ci');
    expect(workflow).toContain('npm test');
  });

  it('generates GitHub Actions workflow for Python project', () => {
    const answer: Answer = {
      projectName: 'my-fastapi-app',
      stack: 'python',
      framework: 'fastapi',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
      extras: ['ci'],
    };

    const workflow = getProjectCiWorkflow(answer);
    expect(workflow).toContain('Setup Python 3.11');
    expect(workflow).toContain('pytest');
  });

  it('generates GitHub Actions workflow for .NET project', () => {
    const answer: Answer = {
      projectName: 'my-dotnet-app',
      stack: 'dotnet',
      framework: 'webapi',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
      extras: ['ci'],
    };

    const workflow = getProjectCiWorkflow(answer);
    expect(workflow).toContain('Setup .NET SDK');
    expect(workflow).toContain('dotnet restore');
    expect(workflow).toContain('dotnet test');
  });

  it('generates GitHub Actions workflow for Flutter project', () => {
    const answer: Answer = {
      projectName: 'my_flutter_app',
      stack: 'flutter',
      framework: 'none',
      appShape: 'standalone',
      architecture: 'feature-first',
      database: 'none',
      orm: 'none',
      extras: ['ci'],
    };

    const workflow = getProjectCiWorkflow(answer);
    expect(workflow).toContain('subosito/flutter-action');
    expect(workflow).toContain('flutter test');
  });

  it('generates multi-job workflow for fullstack project', () => {
    const answer: Answer = {
      projectName: 'my-fullstack-app',
      stack: 'react',
      framework: 'vite',
      appShape: 'fullstack',
      architecture: 'modular-monolith',
      database: 'postgres',
      orm: 'sqlalchemy',
      extras: ['ci'],
      frontend: { stack: 'react', framework: 'vite' },
      backend: { stack: 'python', framework: 'fastapi' },
    };

    const ops = generateProjectCi(answer);
    expect(ops).toHaveLength(1);
    expect(ops[0].path).toBe('.github/workflows/ci.yml');
    expect(ops[0].content).toContain('test-backend:');
    expect(ops[0].content).toContain('test-frontend:');
  });
});
