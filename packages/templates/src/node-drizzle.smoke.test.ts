import { AnswerSchema, DiskFileWriter, generate } from '@codewithsajjad01/core';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FsTemplateSource } from './loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Node.js Drizzle ORM Fragment Smoke Test', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'drizzle-test-'));
  });

  afterEach(async () => {
    if (tempDir && (await fs.pathExists(tempDir))) {
      await fs.remove(tempDir).catch(() => {});
    }
  });

  it('generates Express application composed with Drizzle ORM fragment', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);
    const targetDir = path.join(tempDir, 'MyDrizzleApp');
    await fs.ensureDir(targetDir);

    const answer = AnswerSchema.parse({
      projectName: 'MyDrizzleApp',
      stack: 'node',
      framework: 'express',
      appShape: 'standalone',
      architecture: 'clean',
      database: 'postgres',
      orm: 'drizzle',
      extras: ['docker', 'ci'],
    });

    const fileOps = await generate(answer, templateSource);
    expect(fileOps.length).toBeGreaterThan(0);

    const writer = new DiskFileWriter();
    await writer.write(targetDir, fileOps);

    expect(await fs.pathExists(path.join(targetDir, 'src/db/index.ts'))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, 'src/db/schema.ts'))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, 'drizzle.config.ts'))).toBe(true);

    const pkgJson = await fs.readJson(path.join(targetDir, 'package.json'));
    expect(pkgJson.dependencies['drizzle-orm']).toBeDefined();
    expect(pkgJson.devDependencies['drizzle-kit']).toBeDefined();
  });
});
