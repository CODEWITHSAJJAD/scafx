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

function runCommand(
  command: string,
  args: string[],
  cwd: string,
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const proc = spawn(command, args, {
      cwd,
      shell: isWindows,
      stdio: 'pipe',
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    proc.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, code: code ?? 0 });
    });
  });
}

describe('Microservices Integration & Live Smoke Test', () => {
  let tempDir: string;
  const isWin = process.platform === 'win32';
  const npmCmd = isWin ? 'npm.cmd' : 'npm';
  const pythonCmd = isWin ? 'python' : 'python3';

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'microservices-smoke-'));
  });

  afterAll(async () => {
    try {
      await fs.remove(tempDir);
    } catch {
      // Ignore temporary file locks on Windows
    }
  });

  it('generates a complete heterogeneous microservices monorepo', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);

    const answer: Answer = {
      projectName: 'smoke-test-mesh',
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
      ],
    };

    // 1. Generate planned FileOp[]
    const fileOps = await generate(answer, templateSource);
    expect(fileOps.length).toBeGreaterThan(0);

    // 2. Write to real disk
    const writer = new DiskFileWriter();
    await writer.write(tempDir, fileOps);

    // 3. Verify Gateway files
    const gatewayDir = path.join(tempDir, 'gateway');
    expect(await fs.pathExists(path.join(gatewayDir, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(gatewayDir, 'tsconfig.json'))).toBe(true);
    expect(await fs.pathExists(path.join(gatewayDir, 'src/index.ts'))).toBe(true);
    expect(await fs.pathExists(path.join(gatewayDir, 'Dockerfile'))).toBe(true);

    // 4. Verify Auth Service (Node + Express + Prisma + JWT)
    const authServiceDir = path.join(tempDir, 'services/auth-service');
    expect(await fs.pathExists(path.join(authServiceDir, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(authServiceDir, 'tsconfig.json'))).toBe(true);
    expect(await fs.pathExists(path.join(authServiceDir, 'src/index.ts'))).toBe(true);
    expect(await fs.pathExists(path.join(authServiceDir, 'prisma/schema.prisma'))).toBe(true);
    expect(await fs.pathExists(path.join(authServiceDir, 'src/auth/jwt.ts'))).toBe(true);
    expect(await fs.pathExists(path.join(authServiceDir, 'src/routes/auth.ts'))).toBe(true);
    expect(await fs.pathExists(path.join(authServiceDir, 'Dockerfile'))).toBe(true);

    // 5. Verify Catalog Service (Python + FastAPI + MongoDB)
    const catalogServiceDir = path.join(tempDir, 'services/catalog-service');
    expect(await fs.pathExists(path.join(catalogServiceDir, 'pyproject.toml'))).toBe(true);
    expect(await fs.pathExists(path.join(catalogServiceDir, 'src/app/main.py'))).toBe(true);
    expect(await fs.pathExists(path.join(catalogServiceDir, 'src/app/db/mongo.py'))).toBe(true);
    expect(await fs.pathExists(path.join(catalogServiceDir, 'Dockerfile'))).toBe(true);

    // 6. Verify Root Docker Compose & Network Orchestration
    expect(await fs.pathExists(path.join(tempDir, 'docker-compose.yml'))).toBe(true);
    const compose = await fs.readFile(path.join(tempDir, 'docker-compose.yml'), 'utf-8');
    expect(compose).toContain('microservices-net:');
    expect(compose).toContain('gateway:');
    expect(compose).toContain('auth-service:');
    expect(compose).toContain('catalog-service:');
    expect(compose).toContain('postgres:');
    expect(compose).toContain('mongodb:');

    // 7. Verify Root README & .env.example
    expect(await fs.pathExists(path.join(tempDir, 'README.md'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, '.env.example'))).toBe(true);
  });

  it('compiles Express API Gateway cleanly with npm', async () => {
    const gatewayDir = path.join(tempDir, 'gateway');
    expect(await fs.pathExists(gatewayDir)).toBe(true);

    const installRes = await runCommand(npmCmd, ['install', '--no-audit', '--no-fund'], gatewayDir);
    expect(installRes.code).toBe(0);

    const buildRes = await runCommand(npmCmd, ['run', 'build'], gatewayDir);
    expect(buildRes.code).toBe(0);
    expect(await fs.pathExists(path.join(gatewayDir, 'dist/index.js'))).toBe(true);
  }, 90000);

  it('compiles Node Auth Service cleanly with npm and Prisma generation', async () => {
    const authServiceDir = path.join(tempDir, 'services/auth-service');
    expect(await fs.pathExists(authServiceDir)).toBe(true);

    const installRes = await runCommand(
      npmCmd,
      ['install', '--no-audit', '--no-fund'],
      authServiceDir,
    );
    expect(installRes.code).toBe(0);

    const buildRes = await runCommand(npmCmd, ['run', 'build'], authServiceDir);
    expect(buildRes.code).toBe(0);
    expect(await fs.pathExists(path.join(authServiceDir, 'dist/index.js'))).toBe(true);
  }, 90000);

  it('validates Python FastAPI Catalog Service syntax with py_compile', async () => {
    const catalogMainPath = path.join(tempDir, 'services/catalog-service/src/app/main.py');
    expect(await fs.pathExists(catalogMainPath)).toBe(true);

    const compileRes = await runCommand(pythonCmd, ['-m', 'py_compile', catalogMainPath], tempDir);
    expect(compileRes.code).toBe(0);
  });
});
