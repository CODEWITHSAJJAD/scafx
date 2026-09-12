import semver from 'semver';
import { getCurrentOS } from './os.js';
import type { CheckResult, Checker, OS } from './types.js';

export interface PreflightReport {
  allPassed: boolean;
  results: CheckResult[];
  failures: CheckResult[];
}

export async function runPreflightChecks(
  checkers: Checker[],
  targetOS?: OS,
): Promise<PreflightReport> {
  const os = targetOS ?? getCurrentOS();
  const results: CheckResult[] = [];

  for (const checker of checkers) {
    const detected = await checker.detect();
    let passed = false;

    if (detected.found && detected.version) {
      const minClean =
        semver.coerce(checker.minVersionRequired)?.version ?? checker.minVersionRequired;
      const detectedClean = semver.coerce(detected.version)?.version ?? detected.version;

      passed = semver.gte(detectedClean, minClean);
    }

    results.push({
      name: checker.name,
      found: detected.found,
      version: detected.version,
      minVersionRequired: checker.minVersionRequired,
      passed,
      manualInstructions: checker.manualInstallInstructions(os),
    });
  }

  const failures = results.filter((r) => !r.passed);
  return {
    allPassed: failures.length === 0,
    results,
    failures,
  };
}
