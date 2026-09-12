export type OS = 'win32' | 'darwin' | 'linux';

export interface DetectionResult {
  found: boolean;
  version?: string;
}

export interface CheckResult {
  name: string;
  found: boolean;
  version?: string;
  minVersionRequired: string;
  passed: boolean;
  manualInstructions: string;
}

export interface Checker {
  name: string;
  minVersionRequired: string;
  detect(): Promise<DetectionResult>;
  manualInstallInstructions(os: OS): string;
}
