import { DiskFileWriter, generate, type Answer } from '@project-scaffolder/core';
import { execSync, spawn } from 'node:child_process';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FsTemplateSource } from './loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isFlutterAvailable(): boolean {
  try {
    execSync('flutter --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

describe('Flutter Standard Golden Template Smoke Test', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'flutter-smoke-'));
  });

  afterAll(async () => {
    try {
      await fs.remove(tempDir);
    } catch {
      // Ignore temporary locking on Windows
    }
  });

  it('generates a complete Flutter project and verifies feature-first structure & placeholders', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);

    const answer: Answer = {
      projectName: 'smoke_test_flutter',
      stack: 'flutter',
      framework: 'flutter',
      appShape: 'standalone',
      architecture: 'feature-first',
      database: 'none',
      orm: 'none',
      extras: ['git'],
    };

    // 1. Generate planned FileOp[]
    const fileOps = await generate(answer, templateSource);
    expect(fileOps.length).toBeGreaterThan(0);

    // 2. Write to disk
    const writer = new DiskFileWriter();
    await writer.write(tempDir, fileOps);

    // 3. Verify key files exist
    expect(await fs.pathExists(path.join(tempDir, 'pubspec.yaml'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'analysis_options.yaml'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'lib/main.dart'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'lib/src/app.dart'))).toBe(true);
    expect(
      await fs.pathExists(path.join(tempDir, 'lib/src/core/constants/app_constants.dart')),
    ).toBe(true);
    expect(
      await fs.pathExists(path.join(tempDir, 'lib/src/features/home/domain/counter_state.dart')),
    ).toBe(true);
    expect(
      await fs.pathExists(
        path.join(tempDir, 'lib/src/features/home/presentation/home_screen.dart'),
      ),
    ).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'test/widget_test.dart'))).toBe(true);

    const pubspec = await fs.readFile(path.join(tempDir, 'pubspec.yaml'), 'utf-8');
    expect(pubspec).toContain("name: 'smoke_test_flutter'");
    expect(pubspec).toContain('sdk: flutter');

    const appConstants = await fs.readFile(
      path.join(tempDir, 'lib/src/core/constants/app_constants.dart'),
      'utf-8',
    );
    expect(appConstants).toContain('smoke_test_flutter');
    expect(appConstants).toContain('flutter');

    const homeScreen = await fs.readFile(
      path.join(tempDir, 'lib/src/features/home/presentation/home_screen.dart'),
      'utf-8',
    );
    expect(homeScreen).toContain('Stack: flutter');
    expect(homeScreen).toContain('Architecture: feature-first');
  });

  it('correctly handles framework none fallback and placeholder resolution', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);

    const answer: Answer = {
      projectName: 'my_custom_flutter_app',
      stack: 'flutter',
      framework: 'none',
      appShape: 'standalone',
      architecture: 'feature-first',
      database: 'none',
      orm: 'none',
      extras: [],
    };

    const fileOps = await generate(answer, templateSource);
    const pubspecOp = fileOps.find((f) => f.path === 'pubspec.yaml');
    expect(pubspecOp).toBeDefined();
    expect(pubspecOp?.content).toContain("name: 'my_custom_flutter_app'");

    const widgetTestOp = fileOps.find((f) => f.path === 'test/widget_test.dart');
    expect(widgetTestOp).toBeDefined();
    expect(widgetTestOp?.content).toContain("import 'package:my_custom_flutter_app/src/app.dart';");
  });

  it('runs flutter tests if flutter SDK is present in the environment', async () => {
    if (!isFlutterAvailable()) {
      console.warn('Skipping flutter test execution: Flutter SDK not present in environment');
      return;
    }

    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);

    const answer: Answer = {
      projectName: 'smoke_test_flutter_live',
      stack: 'flutter',
      framework: 'flutter',
      appShape: 'standalone',
      architecture: 'feature-first',
      database: 'none',
      orm: 'none',
      extras: [],
    };

    const testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'flutter-test-'));

    try {
      const fileOps = await generate(answer, templateSource);
      const writer = new DiskFileWriter();
      await writer.write(testDir, fileOps);

      await new Promise<void>((resolve, reject) => {
        const child = spawn('flutter', ['test'], {
          cwd: testDir,
          stdio: 'inherit',
          shell: process.platform === 'win32',
        });
        child.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`flutter test failed with exit code ${code}`));
        });
      });
    } finally {
      try {
        await fs.remove(testDir);
      } catch {
        // Ignore lock
      }
    }
  }, 120000);
});
