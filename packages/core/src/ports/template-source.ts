import type { Answer } from '../schema/answer.js';
import type { TemplateManifest } from '../schema/manifest.js';

export interface TemplateFile {
  path: string;
  content: string;
}

export interface Template {
  manifest: TemplateManifest;
  files: TemplateFile[];
}

export interface TemplateSource {
  getTemplate(answer: Answer): Promise<Template> | Template;
  getFragment?(fragmentId: string): Promise<Template | null> | Template | null;
}
