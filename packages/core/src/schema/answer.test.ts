import { describe, expect, it } from 'vitest';
import { AnswerSchema, type Answer } from './answer.js';

describe('AnswerSchema', () => {
  it('validates a valid sample answer object', () => {
    const validAnswer: Answer = {
      projectName: 'my-express-app',
      stack: 'node',
      framework: 'express',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'postgres',
      orm: 'prisma',
      extras: ['docker', 'env', 'git'],
      runtimeVersion: '>=20.0.0',
    };

    const parsed = AnswerSchema.parse(validAnswer);
    expect(parsed).toEqual(validAnswer);
  });

  it('provides default empty array for extras if omitted', () => {
    const minimalAnswer = {
      projectName: 'fastapi-backend',
      stack: 'python',
      framework: 'fastapi',
      appShape: 'standalone',
      architecture: 'clean',
      database: 'none',
      orm: 'none',
    };

    const parsed = AnswerSchema.parse(minimalAnswer);
    expect(parsed.extras).toEqual([]);
    expect(parsed.projectName).toBe('fastapi-backend');
  });

  it('rejects an empty project name with a clear error message', () => {
    const invalid = {
      projectName: '',
      stack: 'node',
      framework: 'express',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
    };

    const result = AnswerSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some((issue) => issue.path.includes('projectName'))).toBe(true);
      expect(issues[0].message).toMatch(/Project name/i);
    }
  });

  it('rejects an invalid project name containing spaces or forbidden characters', () => {
    const invalid = {
      projectName: 'invalid project name with spaces',
      stack: 'node',
      framework: 'express',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
    };

    const result = AnswerSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('valid directory and package identifier');
    }
  });

  it('rejects an unsupported stack', () => {
    const invalid = {
      projectName: 'my-app',
      stack: 'ruby',
      framework: 'rails',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'postgres',
      orm: 'prisma',
    };

    const result = AnswerSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const stackIssue = result.error.issues.find((issue) => issue.path.includes('stack'));
      expect(stackIssue).toBeDefined();
    }
  });

  it('rejects an invalid framework', () => {
    const invalid = {
      projectName: 'my-app',
      stack: 'node',
      framework: 'unknown-framework',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
    };

    const result = AnswerSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('framework'));
      expect(issue).toBeDefined();
    }
  });

  it('rejects invalid extras items', () => {
    const invalid = {
      projectName: 'my-app',
      stack: 'react',
      framework: 'vite',
      appShape: 'standalone',
      architecture: 'feature-first',
      database: 'none',
      orm: 'none',
      extras: ['invalid-extra-feature'],
    };

    const result = AnswerSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('extras'));
      expect(issue).toBeDefined();
    }
  });
});
