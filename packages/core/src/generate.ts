import { Eta } from 'eta';
import { AnswerSchema, type Answer, type Extra } from './schema/answer.js';
import type { TemplateSource } from './ports/template-source.js';
import type { FileOp } from './types/file-op.js';

export class GeneratorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeneratorError';
  }
}

/**
 * Normalizes template strings so that both simple placeholders like `{{projectName}}`
 * and full Eta expression tags like `{{= it.projectName }}` or `{{ if (...) { }}` work seamlessly.
 */
function normalizePlaceholders(templateStr: string): string {
  return templateStr.replace(
    /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*\}\}/g,
    '{{= it.$1 }}',
  );
}

/**
 * Pure generator function: (answer, templateSource) -> FileOp[]
 * Performs no disk I/O.
 */
export async function generate(answer: Answer, templateSource: TemplateSource): Promise<FileOp[]> {
  const validatedAnswer = AnswerSchema.parse(answer);
  const template = await templateSource.getTemplate(validatedAnswer);

  if (!template || !template.manifest) {
    throw new GeneratorError(
      `No compatible template found for stack: ${validatedAnswer.stack}, framework: ${validatedAnswer.framework}`,
    );
  }

  const { manifest, files } = template;

  // Validate manifest compatibility
  if (!manifest.compatibleShapes.includes(validatedAnswer.appShape)) {
    throw new GeneratorError(
      `Template "${manifest.id}" does not support app shape "${validatedAnswer.appShape}". Compatible shapes: ${manifest.compatibleShapes.join(', ')}`,
    );
  }

  if (
    manifest.compatibleDatabases.length > 0 &&
    !manifest.compatibleDatabases.includes(validatedAnswer.database)
  ) {
    throw new GeneratorError(
      `Template "${manifest.id}" does not support database "${validatedAnswer.database}". Compatible databases: ${manifest.compatibleDatabases.join(', ')}`,
    );
  }

  const eta = new Eta({
    tags: ['{{', '}}'],
    autoEscape: false,
    autoTrim: false,
    rmWhitespace: false,
    useWith: true,
  });

  const context = {
    ...validatedAnswer,
    hasExtra: (extraName: string) => validatedAnswer.extras.includes(extraName as Extra),
  };

  const fileOps: FileOp[] = [];

  for (const file of files) {
    // Normalize and render placeholders in file path
    const normalizedPath = normalizePlaceholders(file.path);
    const renderedPath = eta.renderString(normalizedPath, context);

    // Normalize and render placeholders in file content
    const normalizedContent = normalizePlaceholders(file.content);
    const renderedContent = eta.renderString(normalizedContent, context);

    fileOps.push({
      path: renderedPath,
      content: renderedContent,
    });
  }

  return fileOps;
}
