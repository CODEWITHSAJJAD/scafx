import path from 'node:path';
import type { FileWriter } from '../ports/file-writer.js';
import type { FileOp } from '../types/file-op.js';

export class MemoryFileWriter implements FileWriter {
  private readonly virtualFs: Map<string, string> = new Map();

  async write(targetDir: string, fileOps: FileOp[]): Promise<void> {
    for (const op of fileOps) {
      const normalized = path.join(targetDir, op.path).replace(/\\/g, '/');
      this.virtualFs.set(normalized, op.content);
    }
  }

  getFile(filePath: string): string | undefined {
    const normalized = filePath.replace(/\\/g, '/');
    return this.virtualFs.get(normalized);
  }

  hasFile(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, '/');
    return this.virtualFs.has(normalized);
  }

  getAllFiles(): Map<string, string> {
    return new Map(this.virtualFs);
  }

  clear(): void {
    this.virtualFs.clear();
  }
}
