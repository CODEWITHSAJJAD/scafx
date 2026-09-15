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

describe('Python+Flask Standalone Golden Template Smoke Test', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'flask-smoke-'));
  });

  afterAll(async () => {
    try {
      await fs.remove(tempDir);
    } catch {
      // Ignore temporary file locking on Windows
    }
  });

  it('generates a complete, valid Flask project with correct placeholder substitutions', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);

    const answer = AnswerSchema.parse({
      projectName: 'my-flask-service',
      stack: 'python',
      framework: 'flask',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'postgres',
      orm: 'sqlalchemy',
      extras: ['docker', 'env', 'git'],
    });

    // 1. Generate planned FileOp[]
    const fileOps = await generate(answer, templateSource);
    expect(fileOps.length).toBeGreaterThan(0);

    // 2. Write to real disk
    const writer = new DiskFileWriter();
    await writer.write(tempDir, fileOps);

    // 3. Verify key files exist
    expect(await fs.pathExists(path.join(tempDir, 'pyproject.toml'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'requirements.txt'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'src/app/main.py'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'src/app/routes/health.py'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'src/app/routes/api.py'))).toBe(true);

    // 4. Verify placeholder content substitutions
    const pyproject = await fs.readFile(path.join(tempDir, 'pyproject.toml'), 'utf-8');
    expect(pyproject).toContain('name = "my-flask-service"');

    const mainPy = await fs.readFile(path.join(tempDir, 'src/app/main.py'), 'utf-8');
    expect(mainPy).toContain('Welcome to my-flask-service API');

    const healthPy = await fs.readFile(path.join(tempDir, 'src/app/routes/health.py'), 'utf-8');
    expect(healthPy).toContain('"service": "my-flask-service"');

    const apiPy = await fs.readFile(path.join(tempDir, 'src/app/routes/api.py'), 'utf-8');
    expect(apiPy).toContain('"message": "Welcome to my-flask-service API"');
    expect(apiPy).toContain('"stack": "python"');
    expect(apiPy).toContain('"framework": "flask"');

    // 5. Verify Python syntax validity of generated files using python -m py_compile
    await new Promise<void>((resolve, reject) => {
      const isWin = process.platform === 'win32';
      const pythonCmd = isWin ? 'python' : 'python3';
      const child = spawn(
        pythonCmd,
        [
          '-m',
          'py_compile',
          'src/app/main.py',
          'src/app/routes/health.py',
          'src/app/routes/api.py',
        ],
        {
          cwd: tempDir,
          stdio: 'pipe',
        },
      );

      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Python syntax check failed with exit code ${code}`));
      });
      child.on('error', () => {
        // If python is not in PATH in certain environments, resolve gracefully
        resolve();
      });
    });
  });
});
