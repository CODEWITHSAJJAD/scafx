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

  it('halts with error when preflight checker fails requirements in non-interactive mode', async () => {
    const outDir = path.join(tempDir, 'failing-preflight-app');

    New.customCheckers = [
      {
        name: 'Node.js',
        minVersionRequired: '22.0.0',
        detect: async () => ({ found: true, version: '18.1.0' }),
        manualInstallInstructions: () => 'Upgrade to Node.js 22+',
      },
    ];

    try {
      await expect(
        New.run([
          '--name',
          'failing-preflight-app',
          '--stack',
          'node',
          '--framework',
          'express',
          '--non-interactive',
          '--out',
          outDir,
        ]),
      ).rejects.toThrow(/Preflight check failed/);
    } finally {
      New.customCheckers = undefined;
    }
  });

  it('proceeds with scaffolding when --force or --skip-preflight is passed despite failing preflight', async () => {
    const outDir = path.join(tempDir, 'force-preflight-app');

    New.customCheckers = [
      {
        name: 'Node.js',
        minVersionRequired: '22.0.0',
        detect: async () => ({ found: true, version: '18.1.0' }),
        manualInstallInstructions: () => 'Upgrade to Node.js 22+',
      },
    ];

    try {
      const answer = await New.run([
        '--name',
        'force-preflight-app',
        '--stack',
        'node',
        '--framework',
        'express',
        '--non-interactive',
        '--force',
        '--out',
        outDir,
      ]);

      expect(answer).toBeDefined();
      expect(existsSync(path.join(outDir, 'package.json'))).toBe(true);
    } finally {
      New.customCheckers = undefined;
    }
  });

  it('scaffolds a microservices project end-to-end via CLI flags', async () => {
    const outDir = path.join(tempDir, 'my-microservices-app');

    const answer = await New.run([
      '--name',
      'my-microservices-app',
      '--shape',
      'microservices',
      '--gateway-port',
      '8000',
      '--services',
      'auth-service:node:express:8001:postgres:prisma:auth,catalog-service:python:fastapi:8002:mongodb:motor',
      '--extras',
      'docker,env',
      '--out',
      outDir,
    ]);

    expect(answer).toBeDefined();
    expect(answer.appShape).toBe('microservices');
    expect(answer.gateway?.port).toBe(8000);
    expect(answer.services?.length).toBe(2);

    // Verify gateway and services directories created on disk
    expect(existsSync(path.join(outDir, 'gateway/src/index.ts'))).toBe(true);
    expect(existsSync(path.join(outDir, 'services/auth-service/src/index.ts'))).toBe(true);
    expect(existsSync(path.join(outDir, 'services/catalog-service/src/app/main.py'))).toBe(true);
    expect(existsSync(path.join(outDir, 'docker-compose.yml'))).toBe(true);
    expect(existsSync(path.join(outDir, 'README.md'))).toBe(true);
  });
});
