import process from 'node:process';
import semver from 'semver';
import type { Checker, DetectionResult, OS } from '../types.js';

export class NodeChecker implements Checker {
  public readonly name = 'Node.js';
  public readonly minVersionRequired: string;

  constructor(minVersionRequired = '18.0.0') {
    this.minVersionRequired = minVersionRequired;
  }

  public async detect(): Promise<DetectionResult> {
    try {
      const rawVersion = process.version; // e.g. "v20.10.0"
      const clean = semver.clean(rawVersion) ?? rawVersion.replace(/^v/, '');
      return {
        found: true,
        version: clean,
      };
    } catch {
      return { found: false };
    }
  }

  public manualInstallInstructions(os: OS): string {
    switch (os) {
      case 'win32':
        return 'Download and install Node.js (LTS) from https://nodejs.org or run `winget install OpenJS.NodeJS.LTS` or `fnm install --lts`.';
      case 'darwin':
        return 'Install Node.js via Homebrew: `brew install node` or using nvm: `nvm install --lts`.';
      case 'linux':
        return 'Install Node.js via NodeSource (https://deb.nodesource.com) or using nvm: `nvm install --lts`.';
    }
  }
}
