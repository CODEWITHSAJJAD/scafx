import { describe, expect, it } from 'vitest';
import { DotnetChecker } from './checkers/dotnet.js';
import { NodeChecker } from './checkers/node.js';
import { PythonChecker } from './checkers/python.js';
import { resolveRequiredCheckers } from './resolve.js';
import { runPreflightChecks } from './runner.js';
import type { Checker, OS } from './types.js';

describe('Preflight Checker Suite', () => {
  it('NodeChecker detects current runtime version and returns guidance', async () => {
    const checker = new NodeChecker('16.0.0');
    const result = await checker.detect();

    expect(result.found).toBe(true);
    expect(result.version).toBeDefined();

    const instructionsWin = checker.manualInstallInstructions('win32');
    expect(instructionsWin).toContain('https://nodejs.org');
    const instructionsDarwin = checker.manualInstallInstructions('darwin');
    expect(instructionsDarwin).toContain('brew install node');
    const instructionsLinux = checker.manualInstallInstructions('linux');
    expect(instructionsLinux).toContain('NodeSource');
  });

  it('PythonChecker provides OS-specific installation instructions', () => {
    const checker = new PythonChecker('3.10.0');
    expect(checker.manualInstallInstructions('win32')).toContain('https://python.org');
    expect(checker.manualInstallInstructions('darwin')).toContain('brew install python');
    expect(checker.manualInstallInstructions('linux')).toContain('apt install python3');
  });

  it('DotnetChecker provides OS-specific installation instructions', () => {
    const checker = new DotnetChecker('8.0.0');
    expect(checker.manualInstallInstructions('win32')).toContain('Microsoft.DotNet.SDK.8');
    expect(checker.manualInstallInstructions('darwin')).toContain('brew install --cask dotnet-sdk');
    expect(checker.manualInstallInstructions('linux')).toContain('dotnet-sdk-8.0');
  });

  it('resolveRequiredCheckers maps stacks to necessary checkers', () => {
    const nodeOnly = resolveRequiredCheckers({
      stack: 'node',
      framework: 'express',
      appShape: 'standalone',
    });
    expect(nodeOnly.map((c) => c.name)).toEqual(['Node.js']);

    const pythonOnly = resolveRequiredCheckers({
      stack: 'python',
      framework: 'fastapi',
      appShape: 'standalone',
    });
    expect(pythonOnly.map((c) => c.name)).toEqual(['Python']);

    const dotnetOnly = resolveRequiredCheckers({
      stack: 'dotnet',
      framework: 'webapi',
      appShape: 'standalone',
    });
    expect(dotnetOnly.map((c) => c.name)).toEqual(['.NET SDK']);

    const fullstack = resolveRequiredCheckers({
      stack: 'react',
      framework: 'vite',
      appShape: 'fullstack',
      frontend: { stack: 'react', framework: 'vite' },
      backend: { stack: 'python', framework: 'fastapi' },
    });
    expect(fullstack.map((c) => c.name)).toContain('Node.js');
    expect(fullstack.map((c) => c.name)).toContain('Python');
  });

  it('evaluates passing and failing preflight checks correctly', async () => {
    const passingChecker: Checker = {
      name: 'FakeRuntimeValid',
      minVersionRequired: '2.0.0',
      detect: async () => ({ found: true, version: '2.5.1' }),
      manualInstallInstructions: (_os: OS) => 'Please install FakeRuntime 2.0+',
    };

    const failingCheckerOld: Checker = {
      name: 'FakeRuntimeOld',
      minVersionRequired: '3.0.0',
      detect: async () => ({ found: true, version: '2.1.0' }),
      manualInstallInstructions: (_os: OS) => 'Please upgrade FakeRuntime to 3.0+',
    };

    const failingCheckerMissing: Checker = {
      name: 'FakeRuntimeMissing',
      minVersionRequired: '1.0.0',
      detect: async () => ({ found: false }),
      manualInstallInstructions: (_os: OS) => 'Please install FakeRuntime',
    };

    const report = await runPreflightChecks(
      [passingChecker, failingCheckerOld, failingCheckerMissing],
      'win32',
    );

    expect(report.allPassed).toBe(false);
    expect(report.results).toHaveLength(3);
    expect(report.failures).toHaveLength(2);

    const oldFail = report.failures.find((f) => f.name === 'FakeRuntimeOld');
    expect(oldFail).toBeDefined();
    expect(oldFail?.version).toBe('2.1.0');
    expect(oldFail?.minVersionRequired).toBe('3.0.0');
    expect(oldFail?.manualInstructions).toBe('Please upgrade FakeRuntime to 3.0+');

    const missingFail = report.failures.find((f) => f.name === 'FakeRuntimeMissing');
    expect(missingFail).toBeDefined();
    expect(missingFail?.found).toBe(false);
  });
});
