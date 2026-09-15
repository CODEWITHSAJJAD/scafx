import { AnswerSchema, DiskFileWriter, generate, type Answer } from '@codewithsajjad01/core';
import { spawn } from 'node:child_process';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FsTemplateSource } from './loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runProcess(
  command: string,
  args: string[],
  cwd: string,
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const isWin = process.platform === 'win32';
    const child = spawn(command, args, {
      cwd,
      shell: isWin,
      env: { ...process.env, CI: 'true' },
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr?.on('data', (d) => {
      stderr += d.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ stdout, stderr, code: code ?? 0 });
    });
  });
}

describe('Prisma ORM Fragment Smoke Test', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'node-prisma-smoke-'));
  });

  afterAll(async () => {
    await fs.remove(tempDir);
  });

  it('merges Prisma fragment onto Express template with SQLite database', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);
    const targetDir = path.join(tempDir, 'express-prisma-sqlite');
    await fs.ensureDir(targetDir);

    const answer = AnswerSchema.parse({
      projectName: 'express-prisma-sqlite',
      stack: 'node',
      framework: 'express',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'sqlite',
      orm: 'prisma',
      extras: ['env', 'git', 'testing'],
    });

    // 1. Generate planned FileOp[] with fragment merged
    const fileOps = await generate(answer, templateSource);
    expect(fileOps.length).toBeGreaterThan(0);

    // 2. Write to disk
    const writer = new DiskFileWriter();
    await writer.write(targetDir, fileOps);

    // 3. Verify Express base files exist
    expect(await fs.pathExists(path.join(targetDir, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, 'src/index.ts'))).toBe(true);

    // 4. Verify merged package.json
    const pkgJson = await fs.readJson(path.join(targetDir, 'package.json'));
    expect(pkgJson.dependencies['@prisma/client']).toBeDefined();
    expect(pkgJson.devDependencies['prisma']).toBeDefined();
    expect(pkgJson.scripts['db:generate']).toBe('prisma generate');
    expect(pkgJson.scripts['db:push']).toBe('prisma db push');

    // 5. Verify Prisma schema rendered with SQLite provider
    expect(await fs.pathExists(path.join(targetDir, 'prisma/schema.prisma'))).toBe(true);
    const schemaContent = await fs.readFile(path.join(targetDir, 'prisma/schema.prisma'), 'utf-8');
    expect(schemaContent).toContain('provider = "sqlite"');
    expect(schemaContent).toContain('model User');

    // 6. Verify Prisma Client singleton module
    expect(await fs.pathExists(path.join(targetDir, 'src/db/prisma.ts'))).toBe(true);
    const prismaModule = await fs.readFile(path.join(targetDir, 'src/db/prisma.ts'), 'utf-8');
    expect(prismaModule).toContain("import { PrismaClient } from '@prisma/client'");
    expect(prismaModule).toContain('export const prisma =');

    // 7. Verify .env.example contains SQLite path
    expect(await fs.pathExists(path.join(targetDir, '.env.example'))).toBe(true);
    const envContent = await fs.readFile(path.join(targetDir, '.env.example'), 'utf-8');
    expect(envContent).toContain('DATABASE_URL="file:./dev.db"');

    // 8. Run npm install, prisma generate, and test build
    const installRes = await runProcess('npm', ['install', '--no-audit', '--no-fund'], targetDir);
    expect(installRes.code).toBe(0);

    const genRes = await runProcess('npx', ['prisma', 'generate'], targetDir);
    expect(genRes.code).toBe(0);

    const buildRes = await runProcess('npm', ['run', 'build'], targetDir);
    expect(buildRes.code).toBe(0);
  }, 180000);

  it('merges Prisma fragment onto Fastify template with PostgreSQL database', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);
    const targetDir = path.join(tempDir, 'fastify-prisma-postgres');
    await fs.ensureDir(targetDir);

    const answer = AnswerSchema.parse({
      projectName: 'fastify-prisma-postgres',
      stack: 'node',
      framework: 'fastify',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'postgres',
      orm: 'prisma',
      extras: ['docker', 'env', 'git'],
    });

    const fileOps = await generate(answer, templateSource);
    expect(fileOps.length).toBeGreaterThan(0);

    const writer = new DiskFileWriter();
    await writer.write(targetDir, fileOps);

    // Verify Fastify files exist
    expect(await fs.pathExists(path.join(targetDir, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, 'src/app.ts'))).toBe(true);

    // Verify Prisma schema rendered with postgresql provider
    expect(await fs.pathExists(path.join(targetDir, 'prisma/schema.prisma'))).toBe(true);
    const schemaContent = await fs.readFile(path.join(targetDir, 'prisma/schema.prisma'), 'utf-8');
    expect(schemaContent).toContain('provider = "postgresql"');

    // Verify .env.example contains PostgreSQL connection string
    expect(await fs.pathExists(path.join(targetDir, '.env.example'))).toBe(true);
    const envContent = await fs.readFile(path.join(targetDir, '.env.example'), 'utf-8');
    expect(envContent).toContain(
      'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fastify-prisma-postgres?schema=public"',
    );

    // Verify docker-compose.yml contains Postgres service
    expect(await fs.pathExists(path.join(targetDir, 'docker-compose.yml'))).toBe(true);
    const dockerCompose = await fs.readFile(path.join(targetDir, 'docker-compose.yml'), 'utf-8');
    expect(dockerCompose).toContain('postgres:16-alpine');
    expect(dockerCompose).toContain('fastify-prisma-postgres');
  });
});
