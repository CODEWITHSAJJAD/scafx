import { DiskFileWriter, generate, type Answer } from '@scafx/core';
import { spawn } from 'node:child_process';
import fs from 'fs-extra';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FsTemplateSource } from './loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getJson(url: string): Promise<{ statusCode?: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(raw);
            resolve({ statusCode: res.statusCode, data });
          } catch {
            resolve({ statusCode: res.statusCode, data: raw });
          }
        });
      })
      .on('error', reject);
  });
}

function waitForServer(url: string, maxRetries = 30, intervalMs = 300): Promise<void> {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const check = () => {
      http
        .get(url, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            retry();
          }
        })
        .on('error', () => {
          retry();
        });
    };

    const retry = () => {
      retries++;
      if (retries >= maxRetries) {
        reject(new Error(`Server at ${url} did not respond within timeout`));
      } else {
        setTimeout(check, intervalMs);
      }
    };

    check();
  });
}

describe('Node+Fastify Standalone Golden Template Smoke Test', () => {
  let tempDir: string;
  const testPort = 39872;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fastify-smoke-'));
  });

  afterAll(async () => {
    try {
      await fs.remove(tempDir);
    } catch {
      // Ignore temporary file locking on Windows
    }
  });

  it('generates, builds, starts, and serves endpoints correctly', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);

    const answer: Answer = {
      projectName: 'smoke-test-fastify-api',
      stack: 'node',
      framework: 'fastify',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'postgres',
      orm: 'prisma',
      extras: ['git'],
    };

    // 1. Generate planned FileOp[]
    const fileOps = await generate(answer, templateSource);
    expect(fileOps.length).toBeGreaterThan(0);

    // 2. Write to real disk
    const writer = new DiskFileWriter();
    await writer.write(tempDir, fileOps);

    // Verify key files exist
    expect(await fs.pathExists(path.join(tempDir, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'src/app.ts'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'src/routes/health.ts'))).toBe(true);

    const pkgJson = await fs.readJson(path.join(tempDir, 'package.json'));
    expect(pkgJson.name).toBe('smoke-test-fastify-api');

    const isWin = process.platform === 'win32';
    const npmCmd = isWin ? 'npm.cmd' : 'npm';

    // 3. Install dependencies in generated project via npm
    await new Promise<void>((resolve, reject) => {
      const child = spawn(npmCmd, ['install', '--no-audit', '--no-fund'], {
        cwd: tempDir,
        stdio: 'inherit',
        shell: isWin,
      });
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`npm install failed with exit code ${code}`));
      });
    });

    // 4. Build generated project (TypeScript -> dist)
    await new Promise<void>((resolve, reject) => {
      const child = spawn(npmCmd, ['run', 'build'], {
        cwd: tempDir,
        stdio: 'inherit',
        shell: isWin,
      });
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`npm run build failed with exit code ${code}`));
      });
    });

    expect(await fs.pathExists(path.join(tempDir, 'dist/index.js'))).toBe(true);

    // 5. Start the server
    let serverOutput = '';
    const serverProcess = spawn('node', ['dist/index.js'], {
      cwd: tempDir,
      env: {
        ...process.env,
        PORT: String(testPort),
        HOST: '127.0.0.1',
      },
      stdio: 'pipe',
    });

    serverProcess.stdout?.on('data', (d) => {
      serverOutput += d.toString();
    });
    serverProcess.stderr?.on('data', (d) => {
      serverOutput += d.toString();
    });

    try {
      const healthUrl = `http://127.0.0.1:${testPort}/health`;
      const apiUrl = `http://127.0.0.1:${testPort}/api`;

      // Wait for server to be up
      try {
        await waitForServer(healthUrl);
      } catch (err) {
        throw new Error(`Server failed to start. Logs: ${serverOutput}`, { cause: err });
      }

      // Verify /health endpoint
      const healthRes = await getJson(healthUrl);
      expect(healthRes.statusCode).toBe(200);
      const healthData = healthRes.data as { status: string; service: string };
      expect(healthData.status).toBe('ok');
      expect(healthData.service).toBe('smoke-test-fastify-api');

      // Verify /api endpoint
      const apiRes = await getJson(apiUrl);
      expect(apiRes.statusCode).toBe(200);
      const apiData = apiRes.data as { message: string; stack: string; framework: string };
      expect(apiData.message).toContain('Welcome to smoke-test-fastify-api API');
      expect(apiData.stack).toBe('node');
      expect(apiData.framework).toBe('fastify');
    } finally {
      serverProcess.kill('SIGTERM');
      serverProcess.kill('SIGKILL');
    }
  }, 90000);
});
