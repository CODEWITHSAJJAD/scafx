import type { FileOp } from '../types/file-op.js';

export interface FileWriter {
  write(targetDir: string, fileOps: FileOp[]): Promise<void>;
}
