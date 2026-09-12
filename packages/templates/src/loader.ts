import {
  TemplateManifestSchema,
  type Answer,
  type Template,
  type TemplateFile,
  type TemplateSource,
} from '@project-scaffolder/core';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FsTemplateSource implements TemplateSource {
  private readonly baseDir: string;

  constructor(baseDir?: string) {
    // Default baseDir to the package root (one level up from src/dist)
    this.baseDir = baseDir ?? path.resolve(__dirname, '..');
  }

  async getTemplate(answer: Answer): Promise<Template> {
    const templateDirName = `${answer.stack}-${answer.framework}-${answer.appShape}`;
    const directPath = path.join(this.baseDir, templateDirName);

    let templatePath: string | null = null;

    if (await fs.pathExists(path.join(directPath, 'template.manifest.json'))) {
      templatePath = directPath;
    } else {
      // Search subdirectories for matching manifest
      const entries = await fs.readdir(this.baseDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const candidate = path.join(this.baseDir, entry.name);
          const manifestFile = path.join(candidate, 'template.manifest.json');
          if (await fs.pathExists(manifestFile)) {
            const rawManifest = await fs.readJson(manifestFile);
            const parsed = TemplateManifestSchema.safeParse(rawManifest);
            if (
              parsed.success &&
              parsed.data.stack === answer.stack &&
              parsed.data.framework === answer.framework &&
              parsed.data.compatibleShapes.includes(answer.appShape)
            ) {
              templatePath = candidate;
              break;
            }
          }
        }
      }
    }

    if (!templatePath) {
      throw new Error(
        `No template found matching stack: ${answer.stack}, framework: ${answer.framework}, shape: ${answer.appShape}`,
      );
    }

    const manifestJson = await fs.readJson(path.join(templatePath, 'template.manifest.json'));
    const manifest = TemplateManifestSchema.parse(manifestJson);

    const files: TemplateFile[] = [];
    await this.collectFiles(templatePath, templatePath, files);

    return {
      manifest,
      files,
    };
  }

  private async collectFiles(
    currentDir: string,
    templateRoot: string,
    fileList: TemplateFile[],
  ): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(templateRoot, fullPath).replace(/\\/g, '/');

      // Skip manifest and build/dependency artifacts
      if (
        entry.name === 'template.manifest.json' ||
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === '.git'
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        await this.collectFiles(fullPath, templateRoot, fileList);
      } else if (entry.isFile()) {
        const content = await fs.readFile(fullPath, 'utf-8');
        fileList.push({
          path: relativePath,
          content,
        });
      }
    }
  }
}
