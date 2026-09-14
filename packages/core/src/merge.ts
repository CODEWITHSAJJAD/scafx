import type { FileOp } from './types/file-op.js';

/**
 * Deep merges two JSON strings. If either is invalid JSON, returns the fragment string.
 */
export function mergeJson(baseStr: string, fragmentStr: string): string {
  try {
    const baseObj = JSON.parse(baseStr);
    const fragmentObj = JSON.parse(fragmentStr);

    if (
      typeof baseObj !== 'object' ||
      baseObj === null ||
      typeof fragmentObj !== 'object' ||
      fragmentObj === null ||
      Array.isArray(baseObj) ||
      Array.isArray(fragmentObj)
    ) {
      return fragmentStr;
    }

    const merged = deepMergeObjects(baseObj, fragmentObj);
    return JSON.stringify(merged, null, 2) + '\n';
  } catch {
    return fragmentStr;
  }
}

function deepMergeObjects(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };

  for (const key of Object.keys(source)) {
    const targetVal = target[key];
    const sourceVal = source[key];

    if (
      typeof targetVal === 'object' &&
      targetVal !== null &&
      !Array.isArray(targetVal) &&
      typeof sourceVal === 'object' &&
      sourceVal !== null &&
      !Array.isArray(sourceVal)
    ) {
      result[key] = deepMergeObjects(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
      );
    } else if (Array.isArray(targetVal) && Array.isArray(sourceVal)) {
      // Concatenate and deduplicate primitive elements in arrays
      const combined = [...targetVal, ...sourceVal];
      result[key] = Array.from(new Set(combined));
    } else {
      result[key] = sourceVal;
    }
  }

  return result;
}

/**
 * Merges two .env format files, keeping all existing variables and appending non-duplicate keys from fragment.
 */
export function mergeEnv(baseStr: string, fragmentStr: string): string {
  const baseLines = baseStr.split(/\r?\n/);
  const existingKeys = new Set<string>();

  for (const line of baseLines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (match) {
      existingKeys.add(match[1]);
    }
  }

  const fragmentLines = fragmentStr.split(/\r?\n/);
  const linesToAdd: string[] = [];

  for (const line of fragmentLines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (match) {
      if (!existingKeys.has(match[1])) {
        linesToAdd.push(line);
        existingKeys.add(match[1]);
      }
    } else if (line.trim().startsWith('#') || line.trim() === '') {
      // Keep comments/newlines if they precede new keys
      linesToAdd.push(line);
    }
  }

  const cleanBase = baseStr.trimEnd();
  const cleanToAdd = linesToAdd.join('\n').trim();

  if (!cleanToAdd) {
    return cleanBase + '\n';
  }

  return cleanBase + '\n\n' + cleanToAdd + '\n';
}

/**
 * Merges two .gitignore files by appending unique lines.
 */
export function mergeGitignore(baseStr: string, fragmentStr: string): string {
  const baseLines = baseStr.split(/\r?\n/);
  const existingSet = new Set(baseLines.map((l) => l.trim()).filter(Boolean));

  const fragmentLines = fragmentStr.split(/\r?\n/);
  const toAdd: string[] = [];

  for (const line of fragmentLines) {
    const trimmed = line.trim();
    if (trimmed && !existingSet.has(trimmed)) {
      toAdd.push(line);
      existingSet.add(trimmed);
    }
  }

  if (toAdd.length === 0) {
    return baseStr.trimEnd() + '\n';
  }

  return baseStr.trimEnd() + '\n\n' + toAdd.join('\n') + '\n';
}

/**
 * Merges two requirements.txt files, appending new packages without duplicates.
 */
export function mergeRequirements(baseStr: string, fragmentStr: string): string {
  const baseLines = baseStr.split(/\r?\n/);
  const existingPkgs = new Set<string>();

  for (const line of baseLines) {
    const pkg = line
      .split(/[>=<~!]/)[0]
      .trim()
      .toLowerCase();
    if (pkg && !pkg.startsWith('#')) {
      existingPkgs.add(pkg);
    }
  }

  const fragmentLines = fragmentStr.split(/\r?\n/);
  const toAdd: string[] = [];

  for (const line of fragmentLines) {
    const pkg = line
      .split(/[>=<~!]/)[0]
      .trim()
      .toLowerCase();
    if (pkg && !pkg.startsWith('#')) {
      if (!existingPkgs.has(pkg)) {
        toAdd.push(line.trim());
        existingPkgs.add(pkg);
      }
    } else if (line.trim().startsWith('#')) {
      toAdd.push(line.trim());
    }
  }

  if (toAdd.length === 0) {
    return baseStr.trimEnd() + '\n';
  }

  return baseStr.trimEnd() + '\n\n' + toAdd.join('\n') + '\n';
}

/**
 * Merges markdown files by appending fragment content.
 */
export function mergeMarkdown(baseStr: string, fragmentStr: string): string {
  if (baseStr.includes(fragmentStr.trim())) {
    return baseStr;
  }
  return baseStr.trimEnd() + '\n\n' + fragmentStr.trim() + '\n';
}

/**
 * Merges two docker-compose.yml strings, combining services and volumes sections.
 */
export function mergeDockerCompose(baseStr: string, fragmentStr: string): string {
  if (!baseStr.trim()) return fragmentStr;
  if (!fragmentStr.trim()) return baseStr;

  function parseCompose(content: string) {
    const lines = content.split(/\r?\n/);
    const versionMatch = lines.find((l) => l.trim().startsWith('version:'));
    const versionLine = versionMatch ? versionMatch.trim() : "version: '3.8'";

    const services = new Map<string, string[]>();
    const volumes: string[] = [];

    let currentSection: 'root' | 'services' | 'volumes' | 'other' = 'root';
    let currentServiceName = '';
    let currentServiceLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        if (currentSection === 'services' && currentServiceName) {
          currentServiceLines.push(line);
        }
        continue;
      }

      if (line.match(/^[a-zA-Z0-9_-]+:/)) {
        if (currentServiceName) {
          services.set(currentServiceName, currentServiceLines);
          currentServiceName = '';
          currentServiceLines = [];
        }
        if (trimmed.startsWith('services:')) {
          currentSection = 'services';
        } else if (trimmed.startsWith('volumes:')) {
          currentSection = 'volumes';
        } else if (trimmed.startsWith('version:')) {
          currentSection = 'root';
        } else {
          currentSection = 'other';
        }
        continue;
      }

      if (currentSection === 'services') {
        const serviceHeaderMatch = line.match(/^ {2}([a-zA-Z0-9_-]+):/);
        if (serviceHeaderMatch) {
          if (currentServiceName) {
            services.set(currentServiceName, currentServiceLines);
          }
          currentServiceName = serviceHeaderMatch[1];
          currentServiceLines = [line];
        } else if (currentServiceName) {
          currentServiceLines.push(line);
        }
      } else if (currentSection === 'volumes') {
        if (trimmed) {
          volumes.push(line);
        }
      }
    }

    if (currentServiceName) {
      services.set(currentServiceName, currentServiceLines);
    }

    return { versionLine, services, volumes };
  }

  const base = parseCompose(baseStr);
  const fragment = parseCompose(fragmentStr);

  const mergedVersion = fragment.versionLine || base.versionLine;
  const mergedServices = new Map<string, string[]>(base.services);

  for (const [sName, sLines] of fragment.services.entries()) {
    mergedServices.set(sName, sLines);
  }

  const mergedVolumesSet = new Set<string>();
  const mergedVolumes: string[] = [];

  for (const volLine of [...base.volumes, ...fragment.volumes]) {
    const trimmed = volLine.trim();
    if (trimmed && !mergedVolumesSet.has(trimmed)) {
      mergedVolumesSet.add(trimmed);
      mergedVolumes.push(volLine);
    }
  }

  const serviceBlocks: string[] = [];
  for (const [, lines] of mergedServices.entries()) {
    serviceBlocks.push(lines.join('\n'));
  }

  let result = `${mergedVersion}\n\nservices:\n${serviceBlocks.join('\n\n')}\n`;

  if (mergedVolumes.length > 0) {
    result += `\nvolumes:\n${mergedVolumes.join('\n')}\n`;
  }

  return result;
}

/**
 * Merges two lists of FileOps:
 * - New files from fragment are added.
 * - Existing files are merged based on extension (.json, .env, .gitignore, .md, requirements.txt, docker-compose.yml) or replaced.
 */
export function mergeFileOps(baseOps: FileOp[], fragmentOps: FileOp[]): FileOp[] {
  const result: FileOp[] = baseOps.map((op) => ({ ...op }));
  const fileMap = new Map<string, number>();

  result.forEach((op, index) => {
    fileMap.set(op.path, index);
  });

  for (const fragOp of fragmentOps) {
    if (!fragOp.content || fragOp.content.trim().length === 0) {
      continue;
    }

    const existingIndex = fileMap.get(fragOp.path);

    if (existingIndex === undefined) {
      result.push({ ...fragOp });
      fileMap.set(fragOp.path, result.length - 1);
    } else {
      const existing = result[existingIndex];
      const filename = fragOp.path.toLowerCase();

      if (filename.endsWith('.json')) {
        existing.content = mergeJson(existing.content, fragOp.content);
      } else if (filename.endsWith('.env') || filename.endsWith('.env.example')) {
        existing.content = mergeEnv(existing.content, fragOp.content);
      } else if (filename.endsWith('.gitignore')) {
        existing.content = mergeGitignore(existing.content, fragOp.content);
      } else if (filename.endsWith('.md')) {
        existing.content = mergeMarkdown(existing.content, fragOp.content);
      } else if (
        filename.endsWith('requirements.txt') ||
        filename.endsWith('requirements-dev.txt')
      ) {
        existing.content = mergeRequirements(existing.content, fragOp.content);
      } else if (
        filename.endsWith('docker-compose.yml') ||
        filename.endsWith('docker-compose.yaml')
      ) {
        existing.content = mergeDockerCompose(existing.content, fragOp.content);
      } else {
        // By default, fragment overrides base file
        existing.content = fragOp.content;
      }
    }
  }

  return result;
}
