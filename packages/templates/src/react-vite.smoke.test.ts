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

describe('React+Vite Standalone Golden Template Smoke Test', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'react-vite-smoke-'));
  });

  afterAll(async () => {
    await fs.remove(tempDir);
  });

  it('generates, builds, and verifies placeholder substitution correctly', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);

    const answer: Answer = {
      projectName: 'smoke-test-react',
      stack: 'react',
      framework: 'vite',
      appShape: 'standalone',
      architecture: 'feature-first',
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

    // Verify key files exist
    expect(await fs.pathExists(path.join(tempDir, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'vite.config.ts'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'tsconfig.json'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'index.html'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'src/main.tsx'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'src/App.tsx'))).toBe(true);

    // Verify placeholder substitution
    const pkgJson = await fs.readJson(path.join(tempDir, 'package.json'));
    expect(pkgJson.name).toBe('smoke-test-react');

    const indexHtml = await fs.readFile(path.join(tempDir, 'index.html'), 'utf-8');
    expect(indexHtml).toContain('<title>smoke-test-react</title>');

    const appTsx = await fs.readFile(path.join(tempDir, 'src/App.tsx'), 'utf-8');
    expect(appTsx).toContain('<h1>smoke-test-react</h1>');
    expect(appTsx).toContain('react + vite');

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

    // 4. Build generated project with Vite
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

    // 5. Verify build outputs
    expect(await fs.pathExists(path.join(tempDir, 'dist/index.html'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'dist/assets'))).toBe(true);
  }, 90000);
});
