import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { TemplateManifestSchema } from './manifest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('TemplateManifestSchema', () => {
  it('loads and validates a valid manifest JSON fixture', () => {
    const fixturePath = join(__dirname, '../../test/fixtures/valid-manifest.json');
    const content = JSON.parse(readFileSync(fixturePath, 'utf-8'));

    const manifest = TemplateManifestSchema.parse(content);
    expect(manifest.id).toBe('node-express-standalone');
    expect(manifest.stack).toBe('node');
    expect(manifest.framework).toBe('express');
    expect(manifest.compatibleShapes).toEqual(['standalone']);
    expect(manifest.fragments).toContain('docker');
    expect(manifest.placeholders).toHaveLength(2);
  });

  it('rejects a malformed manifest JSON fixture with clear validation errors', () => {
    const content = JSON.parse(
      readFileSync(join(__dirname, '../../test/fixtures/malformed-manifest.json'), 'utf-8'),
    );

    const result = TemplateManifestSchema.safeParse(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issuePaths = result.error.issues.map((i) => i.path.join('.'));
      expect(issuePaths).toContain('id');
      expect(issuePaths).toContain('stack');
      expect(issuePaths).toContain('framework');
      expect(issuePaths).toContain('compatibleShapes');
      expect(issuePaths).toContain('minRuntimeVersion');
    }
  });

  it('rejects manifest when compatibleShapes is empty', () => {
    const invalid = {
      id: 'test-template',
      stack: 'node',
      framework: 'express',
      compatibleShapes: [],
      minRuntimeVersion: '>=18.0.0',
    };

    const result = TemplateManifestSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('At least one compatible app shape');
    }
  });
});
