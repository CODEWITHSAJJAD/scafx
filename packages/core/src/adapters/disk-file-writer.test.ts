import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generate } from '../generate.js';
import type { TemplateSource, Template } from '../ports/template-source.js';
import { AnswerSchema, type Answer } from '../schema/answer.js';
import type { FileOp } from '../types/file-op.js';
import { DiskFileWriter } from './disk-file-writer.js';
import { MemoryFileWriter } from './memory-file-writer.js';

describe('DiskFileWriter integration', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scaffolder-test-'));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('writes planned FileOp[] to real disk in nested folders', async () => {
    const writer = new DiskFileWriter();
    const ops: FileOp[] = [
      { path: 'package.json', content: '{"name": "real-test"}' },
      { path: 'src/index.ts', content: 'console.log("hello");' },
      { path: 'nested/deep/config.json', content: '{"active": true}' },
    ];

    await writer.write(tempDir, ops);

    // Verify files exist on disk
    expect(await fs.pathExists(path.join(tempDir, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'src/index.ts'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'nested/deep/config.json'))).toBe(true);

    // Verify file contents
    const pkgContent = await fs.readFile(path.join(tempDir, 'package.json'), 'utf-8');
    expect(pkgContent).toBe('{"name": "real-test"}');

    const srcContent = await fs.readFile(path.join(tempDir, 'src/index.ts'), 'utf-8');
    expect(srcContent).toBe('console.log("hello");');
  });

  it('integrates end-to-end with core.generate() and writes real project to temp dir', async () => {
    const fixtureTemplate: Template = {
      manifest: {
        id: 'node-express-real',
        stack: 'node',
        framework: 'express',
        compatibleShapes: ['standalone'],
        compatibleDatabases: ['postgres'],
        minRuntimeVersion: '>=18.0.0',
        placeholders: ['projectName', 'database'],
        fragments: [],
      },
      files: [
        {
          path: 'package.json',
          content: '{"name": "{{projectName}}", "db": "{{database}}"}',
        },
        {
          path: 'src/server.ts',
          content: 'import express from "express";\n// App: {{projectName}}',
        },
      ],
    };

    const templateSource: TemplateSource = {
      getTemplate: () => fixtureTemplate,
    };

    const answer = AnswerSchema.parse({
      projectName: 'my-e2e-project',
      stack: 'node',
      framework: 'express',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'postgres',
      orm: 'prisma',
      extras: ['git'],
    });

    const fileOps = await generate(answer, templateSource);
    const writer = new DiskFileWriter();

    await writer.write(tempDir, fileOps);

    const generatedPkg = await fs.readJson(path.join(tempDir, 'package.json'));
    expect(generatedPkg.name).toBe('my-e2e-project');
    expect(generatedPkg.db).toBe('postgres');

    const serverCode = await fs.readFile(path.join(tempDir, 'src/server.ts'), 'utf-8');
    expect(serverCode).toContain('// App: my-e2e-project');
  });

  it('prevents path traversal attacks', async () => {
    const writer = new DiskFileWriter();
    const maliciousOps: FileOp[] = [{ path: '../../outside.txt', content: 'malicious payload' }];

    await expect(writer.write(tempDir, maliciousOps)).rejects.toThrow(/Path traversal attempt/);
  });

  it('fails when file exists and overwrite is false, but succeeds when overwrite is true', async () => {
    const writerNoOverwrite = new DiskFileWriter({ overwrite: false });
    const writerWithOverwrite = new DiskFileWriter({ overwrite: true });

    const ops: FileOp[] = [{ path: 'existing.txt', content: 'initial content' }];

    await writerNoOverwrite.write(tempDir, ops);

    // Second write without overwrite should throw
    await expect(writerNoOverwrite.write(tempDir, ops)).rejects.toThrow(/File already exists/);

    // Write with overwrite should succeed
    const updatedOps: FileOp[] = [{ path: 'existing.txt', content: 'updated content' }];
    await writerWithOverwrite.write(tempDir, updatedOps);

    const content = await fs.readFile(path.join(tempDir, 'existing.txt'), 'utf-8');
    expect(content).toBe('updated content');
  });
});

describe('MemoryFileWriter unit', () => {
  it('stores files in memory without disk I/O', async () => {
    const writer = new MemoryFileWriter();
    const ops: FileOp[] = [
      { path: 'test.json', content: '{"ok": true}' },
      { path: 'nested/app.ts', content: 'export const x = 1;' },
    ];

    await writer.write('/virtual/project', ops);

    expect(writer.hasFile('/virtual/project/test.json')).toBe(true);
    expect(writer.getFile('/virtual/project/test.json')).toBe('{"ok": true}');
    expect(writer.hasFile('/virtual/project/nested/app.ts')).toBe(true);
  });
});
