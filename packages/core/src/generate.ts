import { Eta } from 'eta';
import { AnswerSchema, type Answer, type Extra } from './schema/answer.js';
import type { Template, TemplateFile, TemplateSource } from './ports/template-source.js';
import type { FileOp } from './types/file-op.js';
import { mergeFileOps } from './merge.js';

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
export function normalizePlaceholders(templateStr: string): string {
  return templateStr.replace(
    /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*\}\}/g,
    '{{= it.$1 }}',
  );
}

/**
 * Renders template files with the provided context and optional path prefix.
 */
export function renderTemplateFiles(
  files: TemplateFile[],
  context: Record<string, unknown>,
  pathPrefix = '',
): FileOp[] {
  const eta = new Eta({
    tags: ['{{', '}}'],
    autoEscape: false,
    autoTrim: false,
    rmWhitespace: false,
    useWith: true,
  });

  const fileOps: FileOp[] = [];

  for (const file of files) {
    // Normalize and render placeholders in file path
    const normalizedPath = normalizePlaceholders(file.path);
    const renderedPath = eta.renderString(normalizedPath, context);
    const finalPath = pathPrefix
      ? `${pathPrefix.replace(/\/$/, '')}/${renderedPath}`
      : renderedPath;

    // Normalize and render placeholders in file content
    const normalizedContent = normalizePlaceholders(file.content);
    const renderedContent = eta.renderString(normalizedContent, context);

    fileOps.push({
      path: finalPath,
      content: renderedContent,
    });
  }

  return fileOps;
}

/**
 * Pure generator function: (answer, templateSource) -> FileOp[]
 * Performs no disk I/O. Supports standalone templates, fullstack composition, and fragment merging.
 */
export async function generate(answer: Answer, templateSource: TemplateSource): Promise<FileOp[]> {
  const validatedAnswer = AnswerSchema.parse(answer);

  if (validatedAnswer.appShape === 'fullstack' || validatedAnswer.appShape === 'frontend-backend') {
    return generateFullstack(validatedAnswer, templateSource);
  }

  return generateStandalone(validatedAnswer, templateSource);
}

async function resolveAndMergeDatabaseFragments(
  currentOps: FileOp[],
  answer: Answer,
  templateSource: TemplateSource,
  context: Record<string, unknown>,
  pathPrefix = '',
): Promise<FileOp[]> {
  if (!templateSource.getFragment || answer.database === 'none' || answer.orm === 'none') {
    return currentOps;
  }

  const candidateFragmentIds = [
    `${answer.stack}-${answer.database}-${answer.orm}`,
    `${answer.database}-${answer.orm}`,
    `orm-${answer.orm}`,
    `db-${answer.database}`,
  ];

  for (const fragId of candidateFragmentIds) {
    const fragment = await templateSource.getFragment(fragId);
    if (fragment && fragment.files.length > 0) {
      const fragmentOps = renderTemplateFiles(fragment.files, context, pathPrefix);
      currentOps = mergeFileOps(currentOps, fragmentOps);
      break;
    }
  }

  return currentOps;
}

async function generateFullstack(
  answer: Answer,
  templateSource: TemplateSource,
): Promise<FileOp[]> {
  const frontendStack = answer.frontend?.stack ?? (answer.stack === 'react' ? 'react' : 'react');
  const frontendFramework =
    answer.frontend?.framework ?? (answer.stack === 'react' ? answer.framework : 'vite');
  const backendStack =
    answer.backend?.stack ?? (answer.stack !== 'react' ? answer.stack : 'python');
  const backendFramework =
    answer.backend?.framework ?? (answer.stack !== 'react' ? answer.framework : 'fastapi');

  const frontendAnswer: Answer = {
    ...answer,
    stack: frontendStack,
    framework: frontendFramework,
    appShape: 'standalone',
  };

  const backendAnswer: Answer = {
    ...answer,
    stack: backendStack,
    framework: backendFramework,
    appShape: 'standalone',
  };

  const frontendTemplate = await templateSource.getTemplate(frontendAnswer);
  if (!frontendTemplate || !frontendTemplate.manifest) {
    throw new GeneratorError(
      `No frontend template found for stack: ${frontendStack}, framework: ${frontendFramework}`,
    );
  }

  const backendTemplate = await templateSource.getTemplate(backendAnswer);
  if (!backendTemplate || !backendTemplate.manifest) {
    throw new GeneratorError(
      `No backend template found for stack: ${backendStack}, framework: ${backendFramework}`,
    );
  }

  const frontendContext = {
    ...frontendAnswer,
    frontendStack,
    frontendFramework,
    backendStack,
    backendFramework,
    frontendPort: 3000,
    backendPort: 8000,
    apiUrl: 'http://localhost:8000',
    hasExtra: (extraName: string) => answer.extras.includes(extraName as Extra),
  };

  const backendContext = {
    ...backendAnswer,
    frontendStack,
    frontendFramework,
    backendStack,
    backendFramework,
    frontendPort: 3000,
    backendPort: 8000,
    apiUrl: 'http://localhost:8000',
    hasExtra: (extraName: string) => answer.extras.includes(extraName as Extra),
  };

  const frontendOps = renderTemplateFiles(frontendTemplate.files, frontendContext, 'frontend');
  const backendOps = renderTemplateFiles(backendTemplate.files, backendContext, 'backend');

  let fileOps = mergeFileOps(frontendOps, backendOps);

  // Apply cors-api-wiring fragment if available or fallback to default fullstack wiring
  let corsFragment: Template | null = null;
  if (templateSource.getFragment) {
    corsFragment = await templateSource.getFragment('cors-api-wiring');
  }

  if (corsFragment && corsFragment.files.length > 0) {
    const fullstackContext = {
      ...answer,
      frontendStack,
      frontendFramework,
      backendStack,
      backendFramework,
      frontendPort: 3000,
      backendPort: 8000,
      apiUrl: 'http://localhost:8000',
      hasExtra: (extraName: string) => answer.extras.includes(extraName as Extra),
    };
    const fragmentOps = renderTemplateFiles(corsFragment.files, fullstackContext);
    fileOps = mergeFileOps(fileOps, fragmentOps);
  } else {
    // Default wiring files
    const defaultWiring: FileOp[] = [
      {
        path: '.env.example',
        content: `# Full-Stack Configuration\nPORT=8000\nFRONTEND_PORT=3000\nVITE_API_URL=http://localhost:8000\nCORS_ORIGINS=http://localhost:3000,http://localhost:5173\n`,
      },
      {
        path: 'frontend/.env.example',
        content: `VITE_API_BASE_URL=http://localhost:8000\n`,
      },
      {
        path: 'backend/.env.example',
        content: `PORT=8000\nCORS_ORIGIN=http://localhost:3000,http://localhost:5173\n`,
      },
    ];
    fileOps = mergeFileOps(fileOps, defaultWiring);
  }

  // Ensure root README.md exists for fullstack project if not provided
  if (!fileOps.some((op) => op.path === 'README.md')) {
    fileOps.push({
      path: 'README.md',
      content: `# ${answer.projectName}\n\nFull-stack application scaffolded with **Universal Project Scaffolder**.\n\n- **Frontend**: ${frontendStack} + ${frontendFramework} (\`/frontend\`)\n- **Backend**: ${backendStack} + ${backendFramework} (\`/backend\`)\n\n## Getting Started\n\n### 1. Frontend\n\`\`\`bash\ncd frontend\nnpm install\nnpm run dev\n\`\`\`\n\n### 2. Backend\n\`\`\`bash\ncd backend\n# Follow backend instructions\n\`\`\`\n`,
    });
  }

  // Apply Database / ORM fragment to backend if selected
  fileOps = await resolveAndMergeDatabaseFragments(
    fileOps,
    backendAnswer,
    templateSource,
    backendContext,
    'backend',
  );

  // Merge any extras fragments requested in answer (e.g. docker, ci, auth)
  if (templateSource.getFragment) {
    for (const extra of answer.extras) {
      const extraFragment = await templateSource.getFragment(extra);
      if (extraFragment && extraFragment.files.length > 0) {
        const extraContext = {
          ...answer,
          frontendStack,
          frontendFramework,
          backendStack,
          backendFramework,
          hasExtra: (extraName: string) => answer.extras.includes(extraName as Extra),
        };
        const extraOps = renderTemplateFiles(extraFragment.files, extraContext);
        fileOps = mergeFileOps(fileOps, extraOps);
      }
    }
  }

  return fileOps;
}

async function generateStandalone(
  answer: Answer,
  templateSource: TemplateSource,
): Promise<FileOp[]> {
  const template = await templateSource.getTemplate(answer);

  if (!template || !template.manifest) {
    throw new GeneratorError(
      `No compatible template found for stack: ${answer.stack}, framework: ${answer.framework}`,
    );
  }

  const { manifest, files } = template;

  // Validate manifest compatibility
  if (!manifest.compatibleShapes.includes(answer.appShape)) {
    throw new GeneratorError(
      `Template "${manifest.id}" does not support app shape "${answer.appShape}". Compatible shapes: ${manifest.compatibleShapes.join(', ')}`,
    );
  }

  if (
    manifest.compatibleDatabases.length > 0 &&
    !manifest.compatibleDatabases.includes(answer.database)
  ) {
    throw new GeneratorError(
      `Template "${manifest.id}" does not support database "${answer.database}". Compatible databases: ${manifest.compatibleDatabases.join(', ')}`,
    );
  }

  const context = {
    ...answer,
    hasExtra: (extraName: string) => answer.extras.includes(extraName as Extra),
  };

  let fileOps = renderTemplateFiles(files, context);

  // Apply Database / ORM fragment if selected
  fileOps = await resolveAndMergeDatabaseFragments(fileOps, answer, templateSource, context);

  // Merge any extra fragments requested in answer
  if (templateSource.getFragment) {
    for (const extra of answer.extras) {
      const extraFragment = await templateSource.getFragment(extra);
      if (extraFragment && extraFragment.files.length > 0) {
        const extraOps = renderTemplateFiles(extraFragment.files, context);
        fileOps = mergeFileOps(fileOps, extraOps);
      }
    }
  }

  return fileOps;
}
