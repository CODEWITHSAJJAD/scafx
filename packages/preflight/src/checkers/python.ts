import { execa } from 'execa';
import semver from 'semver';
import type { Checker, DetectionResult, OS } from '../types.js';

export class PythonChecker implements Checker {
  public readonly name = 'Python';
  public readonly minVersionRequired: string;

  constructor(minVersionRequired = '3.10.0') {
    this.minVersionRequired = minVersionRequired;
  }

  public async detect(): Promise<DetectionResult> {
    const candidates = ['python', 'python3', 'py'];
    for (const cmd of candidates) {
      try {
        const { stdout, stderr } = await execa(cmd, ['--version']);
        const output = (stdout || stderr).trim();
        const match = output.match(/Python\s+(\d+\.\d+\.\d+)/i);
        if (match && match[1]) {
          const clean = semver.clean(match[1]);
          if (clean) {
            return { found: true, version: clean };
          }
        }
      } catch {
        // try next candidate
      }
    }
    return { found: false };
  }

  public manualInstallInstructions(os: OS): string {
    switch (os) {
      case 'win32':
        return 'Download Python 3.10+ from https://python.org or run `winget install Python.Python.3.11` (ensure "Add Python to PATH" is checked).';
      case 'darwin':
        return 'Install Python 3 via Homebrew: `brew install python@3.11` or pyenv: `pyenv install 3.11.8`.';
      case 'linux':
        return 'Install Python 3 via apt/dnf: `sudo apt install python3 python3-pip python3-venv`.';
    }
  }
}
