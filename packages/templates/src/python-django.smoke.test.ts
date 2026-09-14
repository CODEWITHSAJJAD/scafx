import { DiskFileWriter, generate, type Answer } from '@scafx/core';
import { spawn } from 'node:child_process';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FsTemplateSource } from './loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Python+Django Standalone Golden Template Smoke Test', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'django-smoke-'));
  });

  afterAll(async () => {
    try {
      await fs.remove(tempDir);
    } catch {
      // Ignore temporary file locking on Windows
    }
  });

  it('generates a complete, valid Django project with correct placeholder substitutions', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);

    const answer: Answer = {
      projectName: 'my-django-service',
      stack: 'python',
      framework: 'django',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'postgres',
      orm: 'none',
      extras: ['docker', 'env', 'git'],
    };

    // 1. Generate planned FileOp[]
    const fileOps = await generate(answer, templateSource);
    expect(fileOps.length).toBeGreaterThan(0);

    // 2. Write to real disk
    const writer = new DiskFileWriter();
    await writer.write(tempDir, fileOps);

    // 3. Verify key files exist
    expect(await fs.pathExists(path.join(tempDir, 'pyproject.toml'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'requirements.txt'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'manage.py'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'config/settings.py'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'config/urls.py'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'core/views.py'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'core/urls.py'))).toBe(true);

    // 4. Verify placeholder content substitutions
    const pyproject = await fs.readFile(path.join(tempDir, 'pyproject.toml'), 'utf-8');
    expect(pyproject).toContain('name = "my-django-service"');

    const viewsPy = await fs.readFile(path.join(tempDir, 'core/views.py'), 'utf-8');
    expect(viewsPy).toContain('"service": "my-django-service"');
    expect(viewsPy).toContain('"message": "Welcome to my-django-service API"');
    expect(viewsPy).toContain('"stack": "python"');
    expect(viewsPy).toContain('"framework": "django"');

    // 5. Verify Python syntax validity of generated files using python -m py_compile
    await new Promise<void>((resolve, reject) => {
      const isWin = process.platform === 'win32';
      const pythonCmd = isWin ? 'python' : 'python3';
      const child = spawn(
        pythonCmd,
        [
          '-m',
          'py_compile',
          'manage.py',
          'config/settings.py',
          'config/urls.py',
          'config/wsgi.py',
          'config/asgi.py',
          'core/apps.py',
          'core/views.py',
          'core/urls.py',
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
