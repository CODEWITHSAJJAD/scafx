import { DiskFileWriter, generate, type Answer } from '@codewithsajjad01/core';
import { FsTemplateSource } from '@codewithsajjad01/templates';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import New, { parseAnswerFromFlagsOrConfig } from './new.js';

async function hashDirectoryFiles(dir: string): Promise<Record<string, string>> {
  const fileHashes: Record<string, string> = {};

  async function walk(currentDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(dir, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        const buffer = await fs.readFile(fullPath);
        const hash = createHash('sha256').update(buffer).digest('hex');
        fileHashes[relativePath] = hash;
      }
    }
  }

  await walk(dir);
  return fileHashes;
}

describe('Non-interactive mode equivalence', () => {
  let tempBase: string;

  beforeEach(async () => {
    tempBase = await fs.mkdtemp(path.join(os.tmpdir(), 'non-interactive-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempBase, { recursive: true, force: true });
  });

  it('produces byte-identical output between flags mode and config file mode', async () => {
    const flagsOutDir = path.join(tempBase, 'output-flags');
    const configOutDir = path.join(tempBase, 'output-config');
    const configPath = path.join(tempBase, 'scaffold.config.json');

    const configContent = {
      name: 'demo',
      stack: 'node',
      framework: 'express',
      shape: 'standalone',
      arch: 'layered',
      db: 'none',
      orm: 'none',
      extras: [],
    };

    await fs.writeFile(configPath, JSON.stringify(configContent, null, 2), 'utf-8');

    // 1. Run via CLI flags
    const flagsAnswer = await New.run([
      '--name',
      'demo',
      '--stack',
      'node',
      '--framework',
      'express',
      '--shape',
      'standalone',
      '--arch',
      'layered',
      '--db',
      'none',
      '--orm',
      'none',
      '--out',
      flagsOutDir,
      '--silent',
    ]);

    // 2. Run via --config file
    const configAnswer = await New.run(['--config', configPath, '--out', configOutDir, '--silent']);

    // Assert answers are identical
    expect(flagsAnswer).toEqual(configAnswer);

    // Assert generated file structures & contents are byte-identical
    const flagsHashes = await hashDirectoryFiles(flagsOutDir);
    const configHashes = await hashDirectoryFiles(configOutDir);

    expect(Object.keys(flagsHashes).length).toBeGreaterThan(0);
    expect(flagsHashes).toEqual(configHashes);
  }, 20000);

  it('produces byte-identical output between CLI flags and direct core.generate() with identical answer', async () => {
    const cliOutDir = path.join(tempBase, 'cli-demo');
    const directOutDir = path.join(tempBase, 'direct-demo');

    // 1. Run via CLI flags
    const answerFromCli = await New.run([
      '--name',
      'demo',
      '--stack',
      'node',
      '--framework',
      'express',
      '--out',
      cliOutDir,
      '--silent',
    ]);

    // 2. Direct core execution with identical answer
    const directAnswer: Answer = {
      projectName: 'demo',
      stack: 'node',
      framework: 'express',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
      extras: [],
    };

    expect(answerFromCli).toEqual(directAnswer);

    const templateSource = new FsTemplateSource();
    const directFileOps = await generate(directAnswer, templateSource);
    const writer = new DiskFileWriter({ overwrite: false });
    await writer.write(directOutDir, directFileOps);

    // 3. Compare byte-for-byte hashes
    const cliHashes = await hashDirectoryFiles(cliOutDir);
    const directHashes = await hashDirectoryFiles(directOutDir);

    expect(cliHashes).toEqual(directHashes);
  }, 20000);

  it('parses flags and config files into identical validated Answer objects', async () => {
    const configPath = path.join(tempBase, 'answer.json');
    await fs.writeFile(
      configPath,
      JSON.stringify({
        projectName: 'demo-app',
        stack: 'node',
        framework: 'express',
        appShape: 'standalone',
        architecture: 'layered',
        database: 'postgres',
        orm: 'prisma',
        extras: ['docker', 'ci'],
      }),
      'utf-8',
    );

    const fromConfig = await parseAnswerFromFlagsOrConfig({ config: configPath });
    const fromFlags = await parseAnswerFromFlagsOrConfig({
      name: 'demo-app',
      stack: 'node',
      framework: 'express',
      shape: 'standalone',
      arch: 'layered',
      db: 'postgres',
      orm: 'prisma',
      extras: 'docker,ci',
    });

    expect(fromConfig).toEqual(fromFlags);
  });

  it('parses microservices configuration from JSON config file', async () => {
    const configPath = path.join(tempBase, 'microservices.config.json');
    await fs.writeFile(
      configPath,
      JSON.stringify({
        projectName: 'mesh-pos',
        stack: 'node',
        framework: 'express',
        appShape: 'microservices',
        architecture: 'layered',
        database: 'none',
        orm: 'none',
        extras: ['docker', 'env'],
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
      }),
      'utf-8',
    );

    const fromConfig = await parseAnswerFromFlagsOrConfig({ config: configPath });
    expect(fromConfig.appShape).toBe('microservices');
    expect(fromConfig.gateway?.port).toBe(8000);
    expect(fromConfig.services?.length).toBe(2);
    expect(fromConfig.services?.[0].name).toBe('auth-service');
  });
});
