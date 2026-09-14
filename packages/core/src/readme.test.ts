import { describe, expect, it } from 'vitest';
import { generateProjectReadme, getNextCommands } from './readme.js';
import type { Answer } from './schema/answer.js';

describe('Per-project README generation', () => {
  it('generates tailored README for Node+Express standalone project', () => {
    const answer: Answer = {
      projectName: 'my-node-api',
      stack: 'node',
      framework: 'express',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'postgres',
      orm: 'prisma',
      extras: ['docker', 'env', 'git'],
    };

    const readme = generateProjectReadme(answer);
    expect(readme).toContain('# my-node-api');
    expect(readme).toContain('| **Stack / Ecosystem** | `node` |');
    expect(readme).toContain('| **Framework** | `express` |');
    expect(readme).toContain('| **Database** | `postgres` |');
    expect(readme).toContain('| **ORM / Migrations** | `prisma` |');
    expect(readme).toContain('## Database & Migrations');
    expect(readme).toContain('npx prisma migrate dev');
    expect(readme).toContain('## Environment Configuration');

    const nextCommands = getNextCommands(answer);
    expect(nextCommands[0].commands).toContain('cd my-node-api');
    expect(nextCommands[0].commands).toContain('npm install');
    expect(nextCommands[1].commands).toContain('npm run dev');
  });

  it('generates tailored README for Python+FastAPI standalone with SQLAlchemy/Alembic', () => {
    const answer: Answer = {
      projectName: 'my-python-api',
      stack: 'python',
      framework: 'fastapi',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'postgres',
      orm: 'sqlalchemy',
      extras: ['docker', 'env'],
    };

    const readme = generateProjectReadme(answer);
    expect(readme).toContain('# my-python-api');
    expect(readme).toContain('| **Stack / Ecosystem** | `python` |');
    expect(readme).toContain('| **Framework** | `fastapi` |');
    expect(readme).toContain('## Database & Migrations');
    expect(readme).toContain('alembic upgrade head');
    expect(readme).toContain('alembic revision --autogenerate');

    const nextCommands = getNextCommands(answer);
    expect(nextCommands[0].commands).toContain('cd my-python-api');
    expect(nextCommands[0].commands).toContain('pip install -r requirements.txt');
    expect(nextCommands[1].commands).toContain('uvicorn src.app.main:app --reload');
  });

  it('generates tailored README for Fullstack React+Vite + FastAPI project', () => {
    const answer: Answer = {
      projectName: 'my-fullstack-app',
      stack: 'react',
      framework: 'vite',
      appShape: 'fullstack',
      architecture: 'modular-monolith',
      database: 'postgres',
      orm: 'sqlalchemy',
      frontend: {
        stack: 'react',
        framework: 'vite',
      },
      backend: {
        stack: 'python',
        framework: 'fastapi',
      },
      extras: ['docker', 'git'],
    };

    const readme = generateProjectReadme(answer);
    expect(readme).toContain('# my-fullstack-app');
    expect(readme).toContain('### Full-Stack Architecture');
    expect(readme).toContain('/frontend');
    expect(readme).toContain('/backend');
    expect(readme).toContain('docker compose up -d');
    expect(readme).toContain('cp frontend/.env.example frontend/.env');
    expect(readme).toContain('cp backend/.env.example backend/.env');

    const nextCommands = getNextCommands(answer);
    expect(nextCommands.some((step) => step.label.includes('Database'))).toBe(true);
    expect(nextCommands.some((step) => step.label.includes('Backend'))).toBe(true);
    expect(nextCommands.some((step) => step.label.includes('Frontend'))).toBe(true);
  });

  it('generates tailored README with Authentication section when auth extra is selected', () => {
    const answer: Answer = {
      projectName: 'my-auth-api',
      stack: 'node',
      framework: 'express',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
      extras: ['auth', 'env'],
    };

    const readme = generateProjectReadme(answer);
    expect(readme).toContain('# my-auth-api');
    expect(readme).toContain('## Authentication');
    expect(readme).toContain('POST /api/auth/register');
    expect(readme).toContain('POST /api/auth/login');
    expect(readme).toContain('GET /api/auth/me');
  });
});
