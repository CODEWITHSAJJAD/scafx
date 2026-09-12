import { execa } from 'execa';

export interface GitInitOptions {
  commitMessage?: string;
  authorName?: string;
  authorEmail?: string;
}

export async function initGitRepository(
  targetDir: string,
  options: GitInitOptions = {},
): Promise<{ success: boolean; error?: string }> {
  const message = options.commitMessage ?? 'Initial commit from Universal Project Scaffolder';
  const authorName = options.authorName ?? 'Universal Project Scaffolder';
  const authorEmail = options.authorEmail ?? 'scaffolder@local';

  try {
    // 1. git init
    await execa('git', ['init'], { cwd: targetDir });

    // 2. git add -A
    await execa('git', ['add', '-A'], { cwd: targetDir });

    // 3. git commit with local author configuration fallback
    await execa(
      'git',
      ['-c', `user.name=${authorName}`, '-c', `user.email=${authorEmail}`, 'commit', '-m', message],
      { cwd: targetDir },
    );

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}
