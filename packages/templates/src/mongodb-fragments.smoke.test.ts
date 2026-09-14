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

describe('MongoDB Fragments Smoke Test (Mongoose & Motor)', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mongodb-fragments-smoke-'));
  });

  afterAll(async () => {
    await fs.remove(tempDir);
  });

  it('merges Mongoose fragment onto Express template with MongoDB database', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);
    const targetDir = path.join(tempDir, 'express-mongo-app');
    await fs.ensureDir(targetDir);

    const answer: Answer = {
      projectName: 'express-mongo-app',
      stack: 'node',
      framework: 'express',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'mongodb',
      orm: 'mongoose',
      extras: ['docker', 'env', 'git', 'testing'],
    };

    const fileOps = await generate(answer, templateSource);
    expect(fileOps.length).toBeGreaterThan(0);

    const writer = new DiskFileWriter();
    await writer.write(targetDir, fileOps);

    // 1. Verify Express base files
    expect(await fs.pathExists(path.join(targetDir, 'package.json'))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, 'src/index.ts'))).toBe(true);

    // 2. Verify Mongoose package merged
    const pkgJson = await fs.readJson(path.join(targetDir, 'package.json'));
    expect(pkgJson.dependencies['mongoose']).toBeDefined();

    // 3. Verify Mongoose database connection and model
    expect(await fs.pathExists(path.join(targetDir, 'src/db/mongoose.ts'))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, 'src/models/user.ts'))).toBe(true);

    const mongooseCode = await fs.readFile(path.join(targetDir, 'src/db/mongoose.ts'), 'utf-8');
    expect(mongooseCode).toContain("import mongoose from 'mongoose'");
    expect(mongooseCode).toContain('export async function connectDatabase()');

    const userModelCode = await fs.readFile(path.join(targetDir, 'src/models/user.ts'), 'utf-8');
    expect(userModelCode).toContain("export const User = model<IUser>('User', UserSchema);");

    // 4. Verify .env.example
    expect(await fs.pathExists(path.join(targetDir, '.env.example'))).toBe(true);
    const envContent = await fs.readFile(path.join(targetDir, '.env.example'), 'utf-8');
    expect(envContent).toContain('MONGODB_URI="mongodb://localhost:27017/express-mongo-app"');

    // 5. Verify docker-compose.yml
    expect(await fs.pathExists(path.join(targetDir, 'docker-compose.yml'))).toBe(true);
    const dockerContent = await fs.readFile(path.join(targetDir, 'docker-compose.yml'), 'utf-8');
    expect(dockerContent).toContain('mongo:7.0');
    expect(dockerContent).toContain("MONGO_INITDB_DATABASE: 'express-mongo-app'");

    // 6. Run live npm install and build
    const installRes = await runProcess('npm', ['install', '--no-audit', '--no-fund'], targetDir);
    expect(installRes.code).toBe(0);

    const buildRes = await runProcess('npm', ['run', 'build'], targetDir);
    expect(buildRes.code).toBe(0);
  }, 180000);

  it('merges Motor fragment onto FastAPI template with MongoDB database', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);
    const targetDir = path.join(tempDir, 'fastapi-mongo-app');
    await fs.ensureDir(targetDir);

    const answer: Answer = {
      projectName: 'fastapi-mongo-app',
      stack: 'python',
      framework: 'fastapi',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'mongodb',
      orm: 'motor',
      extras: ['docker', 'env', 'git'],
    };

    const fileOps = await generate(answer, templateSource);
    expect(fileOps.length).toBeGreaterThan(0);

    const writer = new DiskFileWriter();
    await writer.write(targetDir, fileOps);

    // 1. Verify FastAPI files
    expect(await fs.pathExists(path.join(targetDir, 'pyproject.toml'))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, 'src/app/main.py'))).toBe(true);

    // 2. Verify Motor requirements merged
    expect(await fs.pathExists(path.join(targetDir, 'requirements.txt'))).toBe(true);
    const reqs = await fs.readFile(path.join(targetDir, 'requirements.txt'), 'utf-8');
    expect(reqs).toContain('fastapi');
    expect(reqs).toContain('motor');
    expect(reqs).toContain('pymongo');

    // 3. Verify Motor database module and model
    expect(await fs.pathExists(path.join(targetDir, 'src/app/db/mongo.py'))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, 'src/app/models/user_mongo.py'))).toBe(true);

    const mongoPy = await fs.readFile(path.join(targetDir, 'src/app/db/mongo.py'), 'utf-8');
    expect(mongoPy).toContain('AsyncIOMotorClient');
    expect(mongoPy).toContain('fastapi-mongo-app');

    // 4. Verify .env.example
    expect(await fs.pathExists(path.join(targetDir, '.env.example'))).toBe(true);
    const envContent = await fs.readFile(path.join(targetDir, '.env.example'), 'utf-8');
    expect(envContent).toContain('MONGODB_URI=mongodb://localhost:27017');
    expect(envContent).toContain('DATABASE_NAME=fastapi-mongo-app');

    // 5. Verify docker-compose.yml
    expect(await fs.pathExists(path.join(targetDir, 'docker-compose.yml'))).toBe(true);
    const dockerContent = await fs.readFile(path.join(targetDir, 'docker-compose.yml'), 'utf-8');
    expect(dockerContent).toContain('mongo:7.0');

    // 6. Verify Python syntax validity
    const isWin = process.platform === 'win32';
    const pythonCmd = isWin ? 'python' : 'python3';
    const pyCompile = await runProcess(
      pythonCmd,
      ['-m', 'py_compile', 'src/app/db/mongo.py', 'src/app/models/user_mongo.py'],
      targetDir,
    );
    expect(pyCompile.code).toBe(0);
  });
});
