import { execa } from 'execa';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initGitRepository } from './git.js';

describe('Git initialization helper', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'git-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('initializes a git repository, stages files, and creates initial commit', async () => {
    // Create dummy files in the directory
    await fs.writeFile(path.join(tempDir, 'README.md'), '# Test Project\n');
    await fs.writeFile(path.join(tempDir, 'package.json'), '{"name": "test"}\n');

    const result = await initGitRepository(tempDir, {
      commitMessage: 'feat: initial scaffold commit',
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();

    // Verify .git exists
    expect(existsSync(path.join(tempDir, '.git'))).toBe(true);

    // Verify commit log
    const { stdout: logOut } = await execa('git', ['log', '-1', '--pretty=%B'], { cwd: tempDir });
    expect(logOut.trim()).toBe('feat: initial scaffold commit');

    // Verify clean working tree
    const { stdout: statusOut } = await execa('git', ['status', '--porcelain'], { cwd: tempDir });
    expect(statusOut.trim()).toBe('');
  });

  it('handles custom author options and fallback defaults', async () => {
    await fs.writeFile(path.join(tempDir, 'index.ts'), 'console.log("hello");\n');

    const result = await initGitRepository(tempDir, {
      authorName: 'Custom Author',
      authorEmail: 'custom@example.com',
    });

    expect(result.success).toBe(true);

    const { stdout: authorOut } = await execa('git', ['log', '-1', '--pretty=%an <%ae>'], {
      cwd: tempDir,
    });
    expect(authorOut.trim()).toBe('Custom Author <custom@example.com>');
  });

  it('returns failure result if directory does not exist', async () => {
    const nonExistentDir = path.join(tempDir, 'does-not-exist');
    const result = await initGitRepository(nonExistentDir);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
