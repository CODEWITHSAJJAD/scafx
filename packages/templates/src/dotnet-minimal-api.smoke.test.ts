import { AnswerSchema, DiskFileWriter, generate } from '@codewithsajjad01/core';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FsTemplateSource } from './loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('.NET 8 Minimal API Golden Template Smoke Test', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dotnet-minimal-test-'));
  });

  afterEach(async () => {
    if (tempDir && (await fs.pathExists(tempDir))) {
      await fs.remove(tempDir).catch(() => {});
    }
  });

  it('generates a valid .NET 8 Minimal API application with clean architecture', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);
    const targetDir = path.join(tempDir, 'MyMinimalApi');
    await fs.ensureDir(targetDir);

    const answer = AnswerSchema.parse({
      projectName: 'MyMinimalApi',
      stack: 'dotnet',
      framework: 'minimal-api',
      appShape: 'standalone',
      architecture: 'clean',
      database: 'postgres',
      orm: 'efcore',
      extras: ['docker', 'ci'],
    });

    const fileOps = await generate(answer, templateSource);
    expect(fileOps.length).toBeGreaterThan(0);

    const writer = new DiskFileWriter();
    await writer.write(targetDir, fileOps);

    expect(await fs.pathExists(path.join(targetDir, 'MyMinimalApi.csproj'))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, 'Program.cs'))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, 'appsettings.json'))).toBe(true);
  });
});
