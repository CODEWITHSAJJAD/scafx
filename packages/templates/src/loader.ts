import {
  TemplateManifestSchema,
  type Answer,
  type Template,
  type TemplateFile,
  type TemplateSource,
} from '@codewithsajjad01/core';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FsTemplateSource implements TemplateSource {
  private readonly baseDir: string;

  constructor(baseDir?: string) {
    if (baseDir) {
      this.baseDir = baseDir;
    } else {
      // Find the templates package directory
      const candidates = [
        path.resolve(__dirname, '..'),
        path.resolve(__dirname, '../../templates'),
        path.resolve(__dirname, '../../../packages/templates'),
        path.resolve(process.cwd(), 'packages/templates'),
      ];

      const found = candidates.find((c) =>
        fs.existsSync(path.join(c, 'stacks/node-express/template.manifest.json')) ||
        fs.existsSync(path.join(c, 'node-express-standalone/template.manifest.json')) ||
        fs.existsSync(path.join(c, 'fragments/node-clean/template.manifest.json')) ||
        fs.existsSync(path.join(c, 'package.json')),
      );

      this.baseDir = found ?? path.resolve(__dirname, '..');
    }
  }

  async getTemplate(answer: Answer): Promise<Template> {
    const directCandidates: string[] = [];

    if (answer.appShape === 'microservices') {
      directCandidates.push(
        path.join(this.baseDir, 'gateways', `gateway-${answer.framework}`),
        path.join(this.baseDir, 'gateways', answer.framework),
        path.join(this.baseDir, `gateway-${answer.framework}`),
        path.join(this.baseDir, 'stacks', `gateway-${answer.framework}`),
      );
    }

    directCandidates.push(
      path.join(this.baseDir, 'stacks', `${answer.stack}-${answer.framework}`),
      path.join(this.baseDir, 'stacks', `${answer.stack}-${answer.framework}-standalone`),
      path.join(this.baseDir, 'stacks', `${answer.stack}-standard`),
      path.join(this.baseDir, 'stacks', answer.stack, answer.framework),
      path.join(this.baseDir, `${answer.stack}-${answer.framework}-${answer.appShape}`),
      path.join(this.baseDir, `${answer.stack}-${answer.framework}-standalone`),
      path.join(this.baseDir, `${answer.stack}-standard`),
    );

    let templatePath: string | null = null;

    for (const candidate of directCandidates) {
      if (await fs.pathExists(path.join(candidate, 'template.manifest.json'))) {
        templatePath = candidate;
        break;
      }
    }

    if (!templatePath) {
      // Search subdirectories recursively within stacks/, gateways/, and root for matching manifest
      const searchRoots = [
        path.join(this.baseDir, 'stacks'),
        path.join(this.baseDir, 'gateways'),
        this.baseDir,
      ];

      for (const root of searchRoots) {
        if (!(await fs.pathExists(root))) continue;
        const entries = await fs.readdir(root, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
            const candidate = path.join(root, entry.name);
            const manifestFile = path.join(candidate, 'template.manifest.json');
            if (await fs.pathExists(manifestFile)) {
              const rawManifest = await fs.readJson(manifestFile);
              const parsed = TemplateManifestSchema.safeParse(rawManifest);
              if (
                parsed.success &&
                parsed.data.stack === answer.stack &&
                (parsed.data.framework === answer.framework ||
                  (answer.stack === 'flutter' &&
                    (parsed.data.framework === 'flutter' || parsed.data.framework === 'none'))) &&
                parsed.data.compatibleShapes.includes(answer.appShape)
              ) {
                templatePath = candidate;
                break;
              }
            }
          }
        }
        if (templatePath) break;
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

  async getFragment(fragmentId: string): Promise<Template | null> {
    const candidateDirs = [
      path.join(this.baseDir, 'fragments', fragmentId),
      path.join(this.baseDir, 'architectures', fragmentId),
      path.join(this.baseDir, 'databases', fragmentId),
      path.join(this.baseDir, 'queues', fragmentId),
      path.join(this.baseDir, 'auth', fragmentId),
      path.join(this.baseDir, 'gateways', fragmentId),
      path.join(this.baseDir, fragmentId),
    ];

    for (const fragmentDir of candidateDirs) {
      const manifestFile = path.join(fragmentDir, 'template.manifest.json');
      if (await fs.pathExists(manifestFile)) {
        const rawManifest = await fs.readJson(manifestFile);
        const manifest = TemplateManifestSchema.parse(rawManifest);
        const files: TemplateFile[] = [];
        await this.collectFiles(fragmentDir, fragmentDir, files);
        return {
          manifest,
          files,
        };
      }
    }

    return null;
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
