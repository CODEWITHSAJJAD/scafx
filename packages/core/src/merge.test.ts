import { describe, expect, it } from 'vitest';
import { mergeEnv, mergeFileOps, mergeGitignore, mergeJson, mergeMarkdown } from './merge.js';
import type { FileOp } from './types/file-op.js';

describe('Merge utilities', () => {
  describe('mergeJson', () => {
    it('deep merges JSON objects with key additions and updates', () => {
      const base = JSON.stringify({
        name: 'my-app',
        scripts: { start: 'node index.js' },
        dependencies: { express: '^4.18.0' },
      });

      const fragment = JSON.stringify({
        scripts: { test: 'vitest run' },
        dependencies: { cors: '^2.8.5' },
        devDependencies: { typescript: '^5.0.0' },
      });

      const merged = JSON.parse(mergeJson(base, fragment));
      expect(merged.name).toBe('my-app');
      expect(merged.scripts).toEqual({
        start: 'node index.js',
        test: 'vitest run',
      });
      expect(merged.dependencies).toEqual({
        express: '^4.18.0',
        cors: '^2.8.5',
      });
      expect(merged.devDependencies).toEqual({
        typescript: '^5.0.0',
      });
    });

    it('concatenates and deduplicates arrays', () => {
      const base = JSON.stringify({
        plugins: ['react', 'vite'],
      });
      const fragment = JSON.stringify({
        plugins: ['vite', 'tailwindcss'],
      });

      const merged = JSON.parse(mergeJson(base, fragment));
      expect(merged.plugins).toEqual(['react', 'vite', 'tailwindcss']);
    });
  });

  describe('mergeEnv', () => {
    it('appends non-duplicate environment variables', () => {
      const base = 'PORT=3000\nNODE_ENV=development';
      const fragment = 'PORT=8000\nDATABASE_URL=postgres://localhost:5432/db';

      const merged = mergeEnv(base, fragment);
      expect(merged).toContain('PORT=3000');
      expect(merged).toContain('NODE_ENV=development');
      expect(merged).toContain('DATABASE_URL=postgres://localhost:5432/db');
    });
  });

  describe('mergeGitignore', () => {
    it('appends new ignore patterns without duplicates', () => {
      const base = 'node_modules\ndist';
      const fragment = 'node_modules\n.env\n*.log';

      const merged = mergeGitignore(base, fragment);
      expect(merged).toContain('node_modules');
      expect(merged).toContain('dist');
      expect(merged).toContain('.env');
      expect(merged).toContain('*.log');
    });
  });

  describe('mergeMarkdown', () => {
    it('appends fragment content to existing markdown', () => {
      const base = '# My Project\n\nIntro text.';
      const fragment = '## Additional Notes\n\nSome notes.';

      const merged = mergeMarkdown(base, fragment);
      expect(merged).toContain('# My Project');
      expect(merged).toContain('## Additional Notes');
    });
  });

  describe('mergeFileOps', () => {
    it('merges non-overlapping and overlapping FileOps correctly', () => {
      const baseOps: FileOp[] = [
        { path: 'package.json', content: JSON.stringify({ name: 'base', version: '1.0.0' }) },
        { path: 'src/index.ts', content: 'console.log("base");' },
      ];

      const fragmentOps: FileOp[] = [
        { path: 'package.json', content: JSON.stringify({ description: 'added via fragment' }) },
        { path: 'docker-compose.yml', content: 'version: "3.8"' },
      ];

      const result = mergeFileOps(baseOps, fragmentOps);
      expect(result).toHaveLength(3);

      const pkg = JSON.parse(result.find((op) => op.path === 'package.json')!.content);
      expect(pkg.name).toBe('base');
      expect(pkg.description).toBe('added via fragment');

      expect(result.find((op) => op.path === 'docker-compose.yml')!.content).toBe('version: "3.8"');
    });
  });
});
