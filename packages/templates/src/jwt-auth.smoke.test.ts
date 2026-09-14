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

function runProcess(
  command: string,
  args: string[],
  cwd: string,
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const isWin = process.platform === 'win32';
    const child = spawn(command, args, {
      cwd,
      shell: isWin,
      env: { ...process.env, CI: 'true' },
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr?.on('data', (d) => {
      stderr += d.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ stdout, stderr, code: code ?? 0 });
    });
  });
}

describe('JWT Authentication Fragment Smoke Test', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jwt-auth-smoke-'));
  });

  afterAll(async () => {
    await fs.remove(tempDir);
  });

  it('merges Node JWT Auth fragment onto Express template and builds cleanly', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);
    const targetDir = path.join(tempDir, 'express-jwt-app');
    await fs.ensureDir(targetDir);

    const answer: Answer = {
      projectName: 'express-jwt-app',
      stack: 'node',
      framework: 'express',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
      extras: ['auth', 'env', 'git'],
    };

    const fileOps = await generate(answer, templateSource);
    expect(fileOps.length).toBeGreaterThan(0);

    const writer = new DiskFileWriter();
    await writer.write(targetDir, fileOps);

    // 1. Verify Node base files
    expect(await fs.pathExists(path.join(targetDir, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, 'src/index.ts'))).toBe(true);

    // 2. Verify JWT dependencies in package.json
    const pkgJson = await fs.readJson(path.join(targetDir, 'package.json'));
    expect(pkgJson.dependencies['jsonwebtoken']).toBeDefined();
    expect(pkgJson.dependencies['bcryptjs']).toBeDefined();

    // 3. Verify Auth modules and routes
    expect(await fs.pathExists(path.join(targetDir, 'src/auth/jwt.ts'))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, 'src/auth/middleware.ts'))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, 'src/routes/auth.ts'))).toBe(true);

    const jwtCode = await fs.readFile(path.join(targetDir, 'src/auth/jwt.ts'), 'utf-8');
    expect(jwtCode).toContain('export function generateToken');
    expect(jwtCode).toContain('export function verifyToken');
    expect(jwtCode).toContain('export async function hashPassword');

    const authRouteCode = await fs.readFile(path.join(targetDir, 'src/routes/auth.ts'), 'utf-8');
    expect(authRouteCode).toContain("authRouter.post('/register'");
    expect(authRouteCode).toContain("authRouter.post('/login'");
    expect(authRouteCode).toContain("authRouter.get('/me'");

    // 4. Verify .env.example
    const envContent = await fs.readFile(path.join(targetDir, '.env.example'), 'utf-8');
    expect(envContent).toContain('JWT_SECRET=');
    expect(envContent).toContain('JWT_EXPIRES_IN=');

    // 5. Run live npm install and build
    const installRes = await runProcess('npm', ['install', '--no-audit', '--no-fund'], targetDir);
    expect(installRes.code).toBe(0);

    const buildRes = await runProcess('npm', ['run', 'build'], targetDir);
    expect(buildRes.code).toBe(0);
  }, 180000);

  it('merges Python JWT Auth fragment onto FastAPI template and passes syntax check', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);
    const targetDir = path.join(tempDir, 'fastapi-jwt-app');
    await fs.ensureDir(targetDir);

    const answer: Answer = {
      projectName: 'fastapi-jwt-app',
      stack: 'python',
      framework: 'fastapi',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
      extras: ['auth', 'env', 'git'],
    };

    const fileOps = await generate(answer, templateSource);
    expect(fileOps.length).toBeGreaterThan(0);

    const writer = new DiskFileWriter();
    await writer.write(targetDir, fileOps);

    // 1. Verify FastAPI files
    expect(await fs.pathExists(path.join(targetDir, 'pyproject.toml'))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, 'src/app/main.py'))).toBe(true);

    // 2. Verify Auth requirements
    expect(await fs.pathExists(path.join(targetDir, 'requirements.txt'))).toBe(true);
    const reqs = await fs.readFile(path.join(targetDir, 'requirements.txt'), 'utf-8');
    expect(reqs).toContain('pyjwt');
    expect(reqs).toContain('passlib');
    expect(reqs).toContain('bcrypt');

    // 3. Verify Python Auth modules and routes
    expect(await fs.pathExists(path.join(targetDir, 'src/app/auth/jwt.py'))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, 'src/app/auth/dependencies.py'))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, 'src/app/routes/auth.py'))).toBe(true);

    const jwtPy = await fs.readFile(path.join(targetDir, 'src/app/auth/jwt.py'), 'utf-8');
    expect(jwtPy).toContain('create_access_token');
    expect(jwtPy).toContain('decode_access_token');
    expect(jwtPy).toContain('hash_password');

    const authPy = await fs.readFile(path.join(targetDir, 'src/app/routes/auth.py'), 'utf-8');
    expect(authPy).toContain('@router.post("/register"');
    expect(authPy).toContain('@router.post("/login"');
    expect(authPy).toContain('@router.get("/me"');

    // 4. Verify .env.example
    const envContent = await fs.readFile(path.join(targetDir, '.env.example'), 'utf-8');
    expect(envContent).toContain('JWT_SECRET=');
    expect(envContent).toContain('JWT_ALGORITHM=');

    // 5. Verify Python syntax validity
    const isWin = process.platform === 'win32';
    const pythonCmd = isWin ? 'python' : 'python3';
    const pyCompile = await runProcess(
      pythonCmd,
      [
        '-m',
        'py_compile',
        'src/app/auth/jwt.py',
        'src/app/auth/dependencies.py',
        'src/app/routes/auth.py',
      ],
      targetDir,
    );
    expect(pyCompile.code).toBe(0);
  });

  it('composes JWT Auth fragment in Fullstack React+Vite + FastAPI project', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);
    const targetDir = path.join(tempDir, 'fullstack-jwt-app');
    await fs.ensureDir(targetDir);

    const answer: Answer = {
      projectName: 'fullstack-jwt-app',
      stack: 'react',
      framework: 'vite',
      appShape: 'fullstack',
      architecture: 'modular-monolith',
      database: 'none',
      orm: 'none',
      frontend: {
        stack: 'react',
        framework: 'vite',
      },
      backend: {
        stack: 'python',
        framework: 'fastapi',
      },
      extras: ['auth', 'docker'],
    };

    const fileOps = await generate(answer, templateSource);
    expect(fileOps.length).toBeGreaterThan(0);

    const writer = new DiskFileWriter();
    await writer.write(targetDir, fileOps);

    // Verify backend received auth fragment
    expect(await fs.pathExists(path.join(targetDir, 'backend/src/app/auth/jwt.py'))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, 'backend/src/app/routes/auth.py'))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, 'frontend/package.json'))).toBe(true);
  });
});
