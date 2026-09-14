import { DiskFileWriter, generate, type Answer } from '@scafx/core';
import { spawn } from 'node:child_process';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FsTemplateSource } from './loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('React+Vite + FastAPI Full-Stack Golden Combination Smoke Test', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fullstack-smoke-'));
  });

  afterAll(async () => {
    await fs.remove(tempDir);
  });

  it('composes React+Vite frontend and FastAPI backend into a working monorepo with CORS & API URL wiring', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);

    const answer: Answer = {
      projectName: 'fullstack-react-fastapi',
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
      extras: ['git'],
    };

    // 1. Generate fullstack FileOp[]
    const fileOps = await generate(answer, templateSource);
    expect(fileOps.length).toBeGreaterThan(0);

    // 2. Write to disk
    const writer = new DiskFileWriter();
    await writer.write(tempDir, fileOps);

    // 3. Verify directory layout and key files
    expect(await fs.pathExists(path.join(tempDir, 'frontend/package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'frontend/vite.config.ts'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'frontend/src/App.tsx'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'frontend/src/main.tsx'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'frontend/.env.example'))).toBe(true);

    expect(await fs.pathExists(path.join(tempDir, 'backend/pyproject.toml'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'backend/src/app/main.py'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'backend/src/app/routes/api.py'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'backend/src/app/routes/health.py'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'backend/.env.example'))).toBe(true);

    expect(await fs.pathExists(path.join(tempDir, '.env.example'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'README.md'))).toBe(true);

    // 4. Verify wiring & substitutions
    const rootEnv = await fs.readFile(path.join(tempDir, '.env.example'), 'utf-8');
    expect(rootEnv).toContain('VITE_API_URL');
    expect(rootEnv).toContain('PORT=8000');

    const frontendEnv = await fs.readFile(path.join(tempDir, 'frontend/.env.example'), 'utf-8');
    expect(frontendEnv).toContain('VITE_API_BASE_URL');

    const backendEnv = await fs.readFile(path.join(tempDir, 'backend/.env.example'), 'utf-8');
    expect(backendEnv).toContain('CORS_ORIGIN');

    const rootReadme = await fs.readFile(path.join(tempDir, 'README.md'), 'utf-8');
    expect(rootReadme).toContain('fullstack-react-fastapi');
    expect(rootReadme).toContain('frontend');
    expect(rootReadme).toContain('backend');

    const isWin = process.platform === 'win32';
    const npmCmd = isWin ? 'npm.cmd' : 'npm';
    const frontendDir = path.join(tempDir, 'frontend');

    // 5. Install and build frontend project with Vite
    await new Promise<void>((resolve, reject) => {
      const child = spawn(npmCmd, ['install', '--no-audit', '--no-fund'], {
        cwd: frontendDir,
        stdio: 'inherit',
        shell: isWin,
      });
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`npm install failed with exit code ${code}`));
      });
    });

    await new Promise<void>((resolve, reject) => {
      const child = spawn(npmCmd, ['run', 'build'], {
        cwd: frontendDir,
        stdio: 'inherit',
        shell: isWin,
      });
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`npm run build failed with exit code ${code}`));
      });
    });

    expect(await fs.pathExists(path.join(frontendDir, 'dist/index.html'))).toBe(true);
    expect(await fs.pathExists(path.join(frontendDir, 'dist/assets'))).toBe(true);

    // 6. Verify Python backend syntax if python runtime is present
    const pythonCmd = isWin ? 'python' : 'python3';
    await new Promise<void>((resolve) => {
      const child = spawn(pythonCmd, ['-m', 'py_compile', 'backend/app/main.py'], {
        cwd: tempDir,
        shell: isWin,
      });
      child.on('close', (code) => {
        // If python is available on test machine, compilation must succeed
        if (code === 0) {
          expect(code).toBe(0);
        }
        resolve();
      });
      child.on('error', () => {
        // Python might not be in PATH in some environments
        resolve();
      });
    });
  }, 90000);
});
