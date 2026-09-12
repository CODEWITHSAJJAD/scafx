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

describe('React+Next.js Standalone Golden Template Smoke Test', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nextjs-smoke-'));
  });

  afterAll(async () => {
    try {
      await fs.remove(tempDir);
    } catch {
      // Ignore temporary file locking on Windows
    }
  });

  it('generates a complete Next.js project, builds successfully, and verifies placeholder substitutions', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);

    const answer: Answer = {
      projectName: 'smoke-test-nextjs',
      stack: 'react',
      framework: 'nextjs',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
      extras: ['git'],
    };

    // 1. Generate planned FileOp[]
    const fileOps = await generate(answer, templateSource);
    expect(fileOps.length).toBeGreaterThan(0);

    // 2. Write to real disk
    const writer = new DiskFileWriter();
    await writer.write(tempDir, fileOps);

    // 3. Verify key files exist
    expect(await fs.pathExists(path.join(tempDir, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'src/app/layout.tsx'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'src/app/page.tsx'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'src/app/api/health/route.ts'))).toBe(true);

    const pkgJson = await fs.readJson(path.join(tempDir, 'package.json'));
    expect(pkgJson.name).toBe('smoke-test-nextjs');

    const pageTsx = await fs.readFile(path.join(tempDir, 'src/app/page.tsx'), 'utf-8');
    expect(pageTsx).toContain('Welcome to smoke-test-nextjs');
    expect(pageTsx).toContain('react');
    expect(pageTsx).toContain('nextjs');

    const isWin = process.platform === 'win32';
    const npmCmd = isWin ? 'npm.cmd' : 'npm';

    // 4. Install dependencies in generated project via npm
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

    // 5. Build generated project via npm run build (next build)
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

    // Verify .next directory build output exists
    expect(await fs.pathExists(path.join(tempDir, '.next'))).toBe(true);
  }, 240000);
});
