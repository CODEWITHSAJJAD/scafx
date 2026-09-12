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
 * Merges markdown files by appending fragment content.
 */
export function mergeMarkdown(baseStr: string, fragmentStr: string): string {
  if (baseStr.includes(fragmentStr.trim())) {
    return baseStr;
  }
  return baseStr.trimEnd() + '\n\n' + fragmentStr.trim() + '\n';
}

/**
 * Merges two lists of FileOps:
 * - New files from fragment are added.
 * - Existing files are merged based on extension (.json, .env, .gitignore, .md) or replaced.
 */
export function mergeFileOps(baseOps: FileOp[], fragmentOps: FileOp[]): FileOp[] {
  const result: FileOp[] = baseOps.map((op) => ({ ...op }));
  const fileMap = new Map<string, number>();

  result.forEach((op, index) => {
    fileMap.set(op.path, index);
  });

  for (const fragOp of fragmentOps) {
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
      } else {
        // By default, fragment overrides base file
        existing.content = fragOp.content;
      }
    }
  }

  return result;
}
