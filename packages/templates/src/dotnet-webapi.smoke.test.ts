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

function isDotnetAvailable(): boolean {
  try {
    execSync('dotnet --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

describe('.NET Web API Standalone Golden Template Smoke Test', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dotnet-smoke-'));
  });

  afterAll(async () => {
    try {
      await fs.remove(tempDir);
    } catch {
      // Ignore Windows directory lock
    }
  });

  it('generates a complete .NET Web API project and verifies file structure & placeholders', async () => {
    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);

    const answer: Answer = {
      projectName: 'smoke-test-webapi',
      stack: 'dotnet',
      framework: 'webapi',
      appShape: 'standalone',
      architecture: 'layered',
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
    expect(await fs.pathExists(path.join(tempDir, 'smoke-test-webapi.csproj'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'Program.cs'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'appsettings.json'))).toBe(true);
    expect(await fs.pathExists(path.join(tempDir, 'Properties/launchSettings.json'))).toBe(true);

    const programCs = await fs.readFile(path.join(tempDir, 'Program.cs'), 'utf-8');
    expect(programCs).toContain('Welcome to smoke-test-webapi!');
    expect(programCs).toContain('stack = "dotnet"');
    expect(programCs).toContain('framework = "webapi"');

    const csproj = await fs.readFile(path.join(tempDir, 'smoke-test-webapi.csproj'), 'utf-8');
    expect(csproj).toContain('<TargetFramework>net8.0</TargetFramework>');
    expect(csproj).toContain('<RootNamespace>smoke-test-webapi</RootNamespace>');
  });

  it('builds and compiles the generated .NET project successfully when dotnet SDK is present', async () => {
    if (!isDotnetAvailable()) {
      console.warn('Skipping dotnet build test: dotnet CLI not available in environment');
      return;
    }

    const templatesDir = path.resolve(__dirname, '..');
    const templateSource = new FsTemplateSource(templatesDir);

    const answer: Answer = {
      projectName: 'smoke-test-compile-api',
      stack: 'dotnet',
      framework: 'webapi',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
      extras: ['git'],
    };

    const buildDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dotnet-build-'));

    try {
      const fileOps = await generate(answer, templateSource);
      const writer = new DiskFileWriter();
      await writer.write(buildDir, fileOps);

      // Execute dotnet build
      await new Promise<void>((resolve, reject) => {
        const child = spawn('dotnet', ['build'], {
          cwd: buildDir,
          stdio: 'inherit',
          shell: process.platform === 'win32',
        });
        child.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`dotnet build failed with exit code ${code}`));
        });
      });

      // Verify build output
      expect(await fs.pathExists(path.join(buildDir, 'bin'))).toBe(true);
      expect(await fs.pathExists(path.join(buildDir, 'obj'))).toBe(true);
    } finally {
      try {
        await fs.remove(buildDir);
      } catch {
        // Ignore lock
      }
    }
  }, 120000);
});
