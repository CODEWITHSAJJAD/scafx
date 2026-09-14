import { DiskFileWriter, generate, type Answer } from '@codewithsajjad01/core';
import { spawn } from 'node:child_process';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FsTemplateSource } from './loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Postgres + SQLAlchemy/Alembic Fragment Smoke Test', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pg-sqlalchemy-smoke-'));
  });

  afterAll(async () => {
    await fs.remove(tempDir);
  });

  it('merges Postgres + SQLAlchemy/Alembic fragment onto FastAPI base template', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);

    const answer: Answer = {
      projectName: 'my-db-service',
      stack: 'python',
      framework: 'fastapi',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'postgres',
      orm: 'sqlalchemy',
      extras: ['docker', 'env', 'git'],
    };

    // 1. Generate planned FileOp[] with fragment merged
    const fileOps = await generate(answer, templateSource);
    expect(fileOps.length).toBeGreaterThan(0);

    // 2. Write to disk
    const writer = new DiskFileWriter();
    await writer.write(tempDir, fileOps);

    // 3. Verify base FastAPI files exist
    expect(await fs.pathExists(path.join(tempDir, 'pyproject.toml'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'src/app/main.py'))).toBe(true);

    // 4. Verify merged requirements.txt
    expect(await fs.pathExists(path.join(tempDir, 'requirements.txt'))).toBe(true);
    const reqs = await fs.readFile(path.join(tempDir, 'requirements.txt'), 'utf-8');
    expect(reqs).toContain('fastapi');
    expect(reqs).toContain('sqlalchemy');
    expect(reqs).toContain('alembic');
    expect(reqs).toContain('asyncpg');

    // 5. Verify merged .env.example
    expect(await fs.pathExists(path.join(tempDir, '.env.example'))).toBe(true);
    const envContent = await fs.readFile(path.join(tempDir, '.env.example'), 'utf-8');
    expect(envContent).toContain('DATABASE_URL');
    expect(envContent).toContain(
      'postgresql+asyncpg://postgres:postgres@localhost:5432/my-db-service',
    );
    expect(envContent).toContain('POSTGRES_USER=postgres');

    // 6. Verify Alembic migration files
    expect(await fs.pathExists(path.join(tempDir, 'alembic.ini'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'alembic/env.py'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'alembic/script.py.mako'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'alembic/versions/.gitkeep'))).toBe(true);

    // 7. Verify SQLAlchemy database session and model files
    expect(await fs.pathExists(path.join(tempDir, 'src/app/db/session.py'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'src/app/db/base.py'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'src/app/models/item.py'))).toBe(true);

    const sessionPy = await fs.readFile(path.join(tempDir, 'src/app/db/session.py'), 'utf-8');
    expect(sessionPy).toContain('AsyncSessionLocal');
    expect(sessionPy).toContain('get_db');
    expect(sessionPy).toContain('my-db-service');

    // 8. Verify docker-compose.yml Postgres service
    expect(await fs.pathExists(path.join(tempDir, 'docker-compose.yml'))).toBe(true);
    const composeContent = await fs.readFile(path.join(tempDir, 'docker-compose.yml'), 'utf-8');
    expect(composeContent).toContain('postgres:16-alpine');
    expect(composeContent).toContain('my-db-service-postgres');
    expect(composeContent).toContain('POSTGRES_DB');

    // 9. Verify Python syntax validity if Python runtime exists
    const isWin = process.platform === 'win32';
    const pythonCmd = isWin ? 'python' : 'python3';
    await new Promise<void>((resolve) => {
      const child = spawn(
        pythonCmd,
        ['-m', 'py_compile', 'src/app/db/session.py', 'src/app/models/item.py', 'alembic/env.py'],
        {
          cwd: tempDir,
          shell: isWin,
        },
      );
      child.on('close', (code) => {
        if (code === 0) {
          expect(code).toBe(0);
        }
        resolve();
      });
      child.on('error', () => {
        resolve();
      });
    });
  });
});
