import { execa } from 'execa';
import semver from 'semver';
import type { Checker, DetectionResult, OS } from '../types.js';

export class DotnetChecker implements Checker {
  public readonly name = '.NET SDK';
  public readonly minVersionRequired: string;

  constructor(minVersionRequired = '8.0.0') {
    this.minVersionRequired = minVersionRequired;
  }

  public async detect(): Promise<DetectionResult> {
    try {
      const { stdout, stderr } = await execa('dotnet', ['--version']);
      const output = (stdout || stderr).trim();
      const clean = semver.clean(output) ?? semver.coerce(output)?.version;
      if (clean) {
        return {
          found: true,
          version: clean,
        };
      }
      return { found: false };
    } catch {
      return { found: false };
    }
  }

  public manualInstallInstructions(os: OS): string {
    switch (os) {
      case 'win32':
        return 'Download and install .NET 8.0+ SDK from https://dotnet.microsoft.com/download or run `winget install Microsoft.DotNet.SDK.8`.';
      case 'darwin':
        return 'Install .NET 8.0+ SDK via Homebrew: `brew install --cask dotnet-sdk` or download from https://dotnet.microsoft.com/download.';
      case 'linux':
        return 'Install .NET 8.0+ SDK via package manager: `sudo apt-get install -y dotnet-sdk-8.0` (see https://learn.microsoft.com/dotnet/core/install/linux).';
    }
  }
}
