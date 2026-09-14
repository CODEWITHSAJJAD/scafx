import { DiskFileWriter, generate, type Answer } from '@project-scaffolder/core';
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

describe('Express API Gateway Golden Template Smoke Test', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gateway-smoke-'));
  });

  afterAll(async () => {
    try {
      await fs.remove(tempDir);
    } catch {
      // Ignore temporary file locks on Windows
    }
  });

  it('generates a complete microservices project with Express API Gateway', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);

    const answer: Answer = {
      projectName: 'smoke-test-microservices',
      stack: 'node',
      framework: 'express',
      appShape: 'microservices',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
      extras: ['env', 'docker'],
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

    // 3. Verify Gateway files on disk
    const gatewayDir = path.join(tempDir, 'gateway');
    expect(await fs.pathExists(path.join(gatewayDir, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(gatewayDir, 'tsconfig.json'))).toBe(true);
    expect(await fs.pathExists(path.join(gatewayDir, 'src/index.ts'))).toBe(true);
    expect(await fs.pathExists(path.join(gatewayDir, '.env.example'))).toBe(true);
    expect(await fs.pathExists(path.join(gatewayDir, 'README.md'))).toBe(true);

    // 4. Verify Downstream services on disk
    expect(await fs.pathExists(path.join(tempDir, 'services/auth-service/package.json'))).toBe(
      true,
    );
    expect(
      await fs.pathExists(path.join(tempDir, 'services/catalog-service/requirements.txt')),
    ).toBe(true);

    // 5. Verify Gateway index.ts contains proxy middleware and healthcheck endpoint
    const gatewayIndexContent = await fs.readFile(path.join(gatewayDir, 'src/index.ts'), 'utf-8');
    expect(gatewayIndexContent).toContain('createProxyMiddleware');
    expect(gatewayIndexContent).toContain('/health');
    expect(gatewayIndexContent).toContain('x-request-id');

    // 6. Verify root files
    expect(await fs.pathExists(path.join(tempDir, '.env.example'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'README.md'))).toBe(true);

    const rootEnvContent = await fs.readFile(path.join(tempDir, '.env.example'), 'utf-8');
    expect(rootEnvContent).toContain('GATEWAY_PORT=8000');
    expect(rootEnvContent).toContain('AUTH_SERVICE_URL=http://localhost:8001');
    expect(rootEnvContent).toContain('CATALOG_SERVICE_URL=http://localhost:8002');
  });

  it('builds the generated Express API Gateway cleanly with npm', async () => {
    const gatewayDir = path.join(tempDir, 'gateway');
    expect(await fs.pathExists(gatewayDir)).toBe(true);

    const isWin = process.platform === 'win32';
    const npmCmd = isWin ? 'npm.cmd' : 'npm';

    // 1. Install dependencies in gateway
    const installRes = await runCommand(npmCmd, ['install', '--no-audit', '--no-fund'], gatewayDir);
    expect(installRes.code).toBe(0);

    // 2. Build TypeScript project
    const buildRes = await runCommand(npmCmd, ['run', 'build'], gatewayDir);
    expect(buildRes.code).toBe(0);
    expect(await fs.pathExists(path.join(gatewayDir, 'dist/index.js'))).toBe(true);
  }, 90000);
});
