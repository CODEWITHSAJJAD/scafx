import fs from 'fs-extra';
import path from 'node:path';
import type { FileWriter } from '../ports/file-writer.js';
import type { FileOp } from '../types/file-op.js';

export interface DiskFileWriterOptions {
  overwrite?: boolean;
}

export class DiskFileWriter implements FileWriter {
  constructor(private readonly options: DiskFileWriterOptions = {}) {}

  async write(targetDir: string, fileOps: FileOp[]): Promise<void> {
    const resolvedTargetDir = path.resolve(targetDir);
    await fs.ensureDir(resolvedTargetDir);

    for (const op of fileOps) {
      const fullPath = path.resolve(resolvedTargetDir, op.path);

      // Security check: prevent directory traversal outside targetDir
      const relative = path.relative(resolvedTargetDir, fullPath);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(`Path traversal attempt detected: ${op.path}`);
      }

      await fs.ensureDir(path.dirname(fullPath));

      if (!this.options.overwrite && (await fs.pathExists(fullPath))) {
        throw new Error(`File already exists: ${fullPath}`);
      }

      await fs.writeFile(fullPath, op.content, 'utf-8');
    }
  }
}
