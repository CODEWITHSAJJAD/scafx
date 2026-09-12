import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import New from './new.js';

describe('CLI scaffold new command', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cli-new-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('scaffolds a Node+Express project end-to-end via CLI flags', async () => {
    const outDir = path.join(tempDir, 'my-cli-api');

    const answer = await New.run([
      '--name',
      'my-cli-api',
      '--stack',
      'node',
      '--framework',
      'express',
      '--shape',
      'standalone',
      '--arch',
      'layered',
      '--db',
      'postgres',
      '--orm',
      'prisma',
      '--extras',
      'docker,env',
      '--out',
      outDir,
    ]);

    expect(answer).toBeDefined();
    expect(answer.projectName).toBe('my-cli-api');
    expect(answer.stack).toBe('node');
    expect(answer.framework).toBe('express');

    // Verify generated files on disk
    expect(existsSync(path.join(outDir, 'package.json'))).toBe(true);
    expect(existsSync(path.join(outDir, 'src/app.ts'))).toBe(true);
    expect(existsSync(path.join(outDir, 'src/routes/health.ts'))).toBe(true);

    const pkgJsonRaw = await fs.readFile(path.join(outDir, 'package.json'), 'utf-8');
    const pkgJson = JSON.parse(pkgJsonRaw);
    expect(pkgJson.name).toBe('my-cli-api');
  });

  it('scaffolds project and initializes git repository when --git is passed', async () => {
    const outDir = path.join(tempDir, 'my-git-app');

    const answer = await New.run([
      '--name',
      'my-git-app',
      '--stack',
      'node',
      '--framework',
      'express',
      '--shape',
      'standalone',
      '--git',
      '--out',
      outDir,
    ]);

    expect(answer.extras).toContain('git');
    expect(existsSync(path.join(outDir, '.git'))).toBe(true);
  });
});
