import { Eta } from 'eta';
import { AnswerSchema, type Answer, type Extra, type ServiceDefinition } from './schema/answer.js';
import type { Template, TemplateFile, TemplateSource } from './ports/template-source.js';
import type { FileOp } from './types/file-op.js';
import { mergeFileOps } from './merge.js';
import { generateProjectReadme } from './readme.js';
import { generateProjectDocker } from './docker.js';
import { generateProjectCi } from './ci.js';

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
 * Performs no disk I/O. Supports standalone templates, fullstack composition, microservices, and fragment merging.
 */
export async function generate(answer: Answer, templateSource: TemplateSource): Promise<FileOp[]> {
  const validatedAnswer = AnswerSchema.parse(answer);

  if (validatedAnswer.appShape === 'microservices') {
    return generateMicroservices(validatedAnswer, templateSource);
  }

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

  const dbAlias = answer.database === 'mongodb' ? 'mongo' : answer.database;
  const candidateFragmentIds = [
    `${answer.stack}-${answer.database}-${answer.orm}`,
    `${answer.stack}-${dbAlias}-${answer.orm}`,
    `${answer.stack}-${answer.orm}`,
    `${answer.database}-${answer.orm}`,
    `${dbAlias}-${answer.orm}`,
    `orm-${answer.orm}`,
    `db-${answer.database}`,
    `db-${dbAlias}`,
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

async function resolveAndMergeAuthFragments(
  currentOps: FileOp[],
  answer: Answer,
  templateSource: TemplateSource,
  context: Record<string, unknown>,
  pathPrefix = '',
): Promise<FileOp[]> {
  if (!templateSource.getFragment || !answer.extras.includes('auth')) {
    return currentOps;
  }

  const candidateFragmentIds = [
    `${answer.stack}-${answer.framework}-auth`,
    `auth-jwt-${answer.stack}`,
    `${answer.stack}-auth-jwt`,
    `${answer.stack}-auth`,
    `auth-jwt`,
    `auth`,
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

  // Generate tailored root README.md
  const readmeOp: FileOp = {
    path: 'README.md',
    content: generateProjectReadme(answer),
  };
  fileOps = mergeFileOps(fileOps, [readmeOp]);

  // Apply Database / ORM fragment to backend if selected
  fileOps = await resolveAndMergeDatabaseFragments(
    fileOps,
    backendAnswer,
    templateSource,
    backendContext,
    'backend',
  );

  // Apply JWT Auth fragment to backend if selected
  fileOps = await resolveAndMergeAuthFragments(
    fileOps,
    backendAnswer,
    templateSource,
    backendContext,
    'backend',
  );

  // Merge any extras fragments requested in answer (e.g. docker, ci, auth)
  if (answer.extras.includes('docker')) {
    const dockerOps = generateProjectDocker(answer);
    fileOps = mergeFileOps(fileOps, dockerOps);
  }

  if (answer.extras.includes('ci')) {
    const ciOps = generateProjectCi(answer);
    fileOps = mergeFileOps(fileOps, ciOps);
  }

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

  // Apply JWT Auth fragment if selected
  fileOps = await resolveAndMergeAuthFragments(fileOps, answer, templateSource, context);

  // Apply tailored README.md
  const readmeOp: FileOp = {
    path: 'README.md',
    content: generateProjectReadme(answer),
  };
  fileOps = mergeFileOps(fileOps, [readmeOp]);

  // Apply Docker extra if selected
  if (answer.extras.includes('docker')) {
    const dockerOps = generateProjectDocker(answer);
    fileOps = mergeFileOps(fileOps, dockerOps);
  }

  // Apply CI extra if selected
  if (answer.extras.includes('ci')) {
    const ciOps = generateProjectCi(answer);
    fileOps = mergeFileOps(fileOps, ciOps);
  }

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

async function generateMicroservices(
  answer: Answer,
  templateSource: TemplateSource,
): Promise<FileOp[]> {
  const gateway = answer.gateway ?? { stack: 'node', framework: 'express', port: 8000 };
  const services: ServiceDefinition[] =
    answer.services && answer.services.length > 0
      ? answer.services
      : [
          {
            name: 'auth-service',
            stack: 'node',
            framework: 'express',
            port: 8001,
            database: 'postgres',
            orm: 'prisma',
            extras: ['auth'],
          },
          {
            name: 'catalog-service',
            stack: 'python',
            framework: 'fastapi',
            port: 8002,
            database: 'mongodb',
            orm: 'motor',
            extras: [],
          },
        ];

  let fileOps: FileOp[] = [];

  // 1. Generate Gateway
  const gatewayAnswer: Answer = {
    projectName: `${answer.projectName}-gateway`,
    stack: gateway.stack,
    framework: gateway.framework,
    appShape: 'standalone',
    architecture: 'layered',
    database: 'none',
    orm: 'none',
    extras: [],
  };

  let gatewayTemplate: Template | null = null;
  if (templateSource.getTemplate) {
    try {
      const candidate = await templateSource.getTemplate({
        ...gatewayAnswer,
        appShape: 'microservices',
        projectName: 'gateway',
      });
      if (candidate && candidate.manifest && candidate.manifest.id.includes('gateway')) {
        gatewayTemplate = candidate;
      }
    } catch {
      gatewayTemplate = null;
    }
  }

  const gatewayContext = {
    ...gatewayAnswer,
    gatewayPort: gateway.port,
    services,
    hasExtra: (extraName: string) => answer.extras.includes(extraName as Extra),
  };

  if (gatewayTemplate && gatewayTemplate.files.length > 0) {
    const gatewayOps = renderTemplateFiles(gatewayTemplate.files, gatewayContext, 'gateway');
    fileOps = mergeFileOps(fileOps, gatewayOps);
  } else {
    // Generate default Node/Express Gateway proxy
    const defaultGatewayOps: FileOp[] = [
      {
        path: 'gateway/package.json',
        content:
          JSON.stringify(
            {
              name: `${answer.projectName}-gateway`,
              version: '0.1.0',
              private: true,
              type: 'module',
              scripts: {
                build: 'tsc',
                start: 'node dist/index.js',
                dev: 'tsx watch src/index.ts',
              },
              dependencies: {
                dotenv: '^16.4.7',
                express: '^4.21.2',
                'http-proxy-middleware': '^3.0.3',
                cors: '^2.8.5',
              },
              devDependencies: {
                '@types/cors': '^2.8.17',
                '@types/express': '^5.0.0',
                '@types/node': '^22.13.10',
                tsx: '^4.19.3',
                typescript: '^5.8.2',
              },
            },
            null,
            2,
          ) + '\n',
      },
      {
        path: 'gateway/tsconfig.json',
        content:
          JSON.stringify(
            {
              compilerOptions: {
                target: 'ES2022',
                module: 'NodeNext',
                moduleResolution: 'NodeNext',
                outDir: './dist',
                rootDir: './src',
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
              },
              include: ['src/**/*'],
            },
            null,
            2,
          ) + '\n',
      },
      {
        path: 'gateway/src/index.ts',
        content: `import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

const app = express();
const PORT = process.env.GATEWAY_PORT || ${gateway.port};

app.use(cors());
app.use(express.json());

// Correlation ID & Request Logger Middleware
app.use((req, res, next) => {
  const requestId =
    req.headers['x-request-id'] ||
    \`req-\${Date.now()}-\${Math.random().toString(36).slice(2, 7)}\`;
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId as string);
  console.log(\`[\${new Date().toISOString()}] [\${requestId}] \${req.method} \${req.originalUrl}\`);
  next();
});

// Gateway Aggregated Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    routes: [
${services.map((s) => `      { path: '/api/${s.name.replace(/-service$/, '')}', target: process.env.${s.name.toUpperCase().replace(/-/g, '_')}_URL || 'http://localhost:${s.port}' }`).join(',\n')}
    ],
  });
});

// Reverse Proxy Route Registration
${services
  .map((s) => {
    const routePrefix = `/api/${s.name.replace(/-service$/, '')}`;
    const envVar = `${s.name.toUpperCase().replace(/-/g, '_')}_URL`;
    return `// Proxy to ${s.name}
app.use(
  '${routePrefix}',
  createProxyMiddleware({
    target: process.env.${envVar} || 'http://localhost:${s.port}',
    changeOrigin: true,
    pathRewrite: { '^${routePrefix}': '' },
  }),
);`;
  })
  .join('\n\n')}

app.listen(PORT, () => {
  console.log(\`🚀 API Gateway is running on http://localhost:\${PORT}\`);
});
`,
      },
      {
        path: 'gateway/.env.example',
        content:
          `GATEWAY_PORT=${gateway.port}\n` +
          services
            .map(
              (s) => `${s.name.toUpperCase().replace(/-/g, '_')}_URL=http://localhost:${s.port}\n`,
            )
            .join(''),
      },
    ];
    fileOps = mergeFileOps(fileOps, defaultGatewayOps);
  }

  // 2. Generate each downstream Service
  for (const service of services) {
    const serviceAnswer: Answer = {
      ...answer,
      projectName: service.name,
      stack: service.stack,
      framework: service.framework,
      appShape: 'standalone',
      architecture: 'layered',
      database: service.database ?? 'none',
      orm: service.orm ?? 'none',
      extras: service.extras ?? [],
    };

    const serviceTemplate = await templateSource.getTemplate(serviceAnswer);
    if (!serviceTemplate || !serviceTemplate.manifest) {
      throw new GeneratorError(
        `No template found for microservice "${service.name}" (stack: ${service.stack}, framework: ${service.framework})`,
      );
    }

    const serviceContext = {
      ...serviceAnswer,
      servicePort: service.port,
      port: service.port,
      hasExtra: (extraName: string) => serviceAnswer.extras.includes(extraName as Extra),
    };

    const servicePathPrefix = `services/${service.name}`;
    let serviceOps = renderTemplateFiles(serviceTemplate.files, serviceContext, servicePathPrefix);

    // Apply database/orm fragment to this service if configured
    serviceOps = await resolveAndMergeDatabaseFragments(
      serviceOps,
      serviceAnswer,
      templateSource,
      serviceContext,
      servicePathPrefix,
    );

    // Apply auth fragment to this service if configured
    serviceOps = await resolveAndMergeAuthFragments(
      serviceOps,
      serviceAnswer,
      templateSource,
      serviceContext,
      servicePathPrefix,
    );

    // Ensure service .env.example declares its service port
    const serviceEnvOp: FileOp = {
      path: `${servicePathPrefix}/.env.example`,
      content: `PORT=${service.port}\nSERVICE_NAME=${service.name}\n`,
    };
    serviceOps = mergeFileOps(serviceOps, [serviceEnvOp]);

    fileOps = mergeFileOps(fileOps, serviceOps);
  }

  // 3. Root files: .env.example, README.md, docker, ci
  let rootEnv = `# Microservices Root Environment Configuration\nGATEWAY_PORT=${gateway.port}\n`;
  for (const s of services) {
    rootEnv += `${s.name.toUpperCase().replace(/-/g, '_')}_URL=http://localhost:${s.port}\n`;
  }
  fileOps = mergeFileOps(fileOps, [{ path: '.env.example', content: rootEnv }]);

  // README
  fileOps = mergeFileOps(fileOps, [
    {
      path: 'README.md',
      content: generateProjectReadme(answer),
    },
  ]);

  // Docker
  if (answer.extras.includes('docker')) {
    const dockerOps = generateProjectDocker(answer);
    fileOps = mergeFileOps(fileOps, dockerOps);
  }

  // CI
  if (answer.extras.includes('ci')) {
    const ciOps = generateProjectCi(answer);
    fileOps = mergeFileOps(fileOps, ciOps);
  }

  return fileOps;
}
