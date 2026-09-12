import process from 'node:process';
import type { OS } from './types.js';

export function getCurrentOS(): OS {
  switch (process.platform) {
    case 'win32':
      return 'win32';
    case 'darwin':
      return 'darwin';
    default:
      return 'linux';
  }
}
