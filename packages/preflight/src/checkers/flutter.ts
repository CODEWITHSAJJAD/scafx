import { execa } from 'execa';
import semver from 'semver';
import type { Checker, DetectionResult, OS } from '../types.js';

export class FlutterChecker implements Checker {
  public readonly name = 'Flutter SDK';
  public readonly minVersionRequired: string;

  constructor(minVersionRequired = '3.19.0') {
    this.minVersionRequired = minVersionRequired;
  }

  public async detect(): Promise<DetectionResult> {
    try {
      const { stdout, stderr } = await execa('flutter', ['--version']);
      const output = (stdout || stderr).trim();
      const match = output.match(/Flutter\s+(\d+\.\d+\.\d+)/i);
      if (match && match[1]) {
        const clean = semver.clean(match[1]) ?? semver.coerce(match[1])?.version;
        if (clean) {
          return {
            found: true,
            version: clean,
          };
        }
      }
      return { found: false };
    } catch {
      return { found: false };
    }
  }

  public manualInstallInstructions(os: OS): string {
    switch (os) {
      case 'win32':
        return 'Download and install Flutter SDK from https://docs.flutter.dev/get-started/install/windows or run `winget install Google.Flutter`.';
      case 'darwin':
        return 'Install Flutter SDK via Homebrew: `brew install --cask flutter` or download from https://docs.flutter.dev/get-started/install/macos.';
      case 'linux':
        return 'Install Flutter SDK via snap: `sudo snap install flutter --classic` or download from https://docs.flutter.dev/get-started/install/linux.';
    }
  }
}
