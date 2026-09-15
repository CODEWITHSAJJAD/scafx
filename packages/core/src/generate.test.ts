import { describe, expect, it } from 'vitest';
import { generate, GeneratorError } from './generate.js';
import { AnswerSchema, type Answer } from './schema/answer.js';
import type { TemplateSource, Template } from './ports/template-source.js';

describe('core.generate()', () => {
  const sampleManifest = {
    id: 'node-express-fixture',
    stack: 'node' as const,
    framework: 'express' as const,
    compatibleShapes: ['standalone' as const],
    compatibleDatabases: ['postgres' as const, 'none' as const],
    minRuntimeVersion: '>=18.0.0',
    placeholders: ['projectName', 'database'],
    fragments: ['docker'],
  };

  const sampleTemplate: Template = {
    manifest: sampleManifest,
    files: [
      {
        path: 'package.json',
        content: JSON.stringify(
          {
            name: '{{projectName}}',
            version: '1.0.0',
            stack: '{{stack}}',
            db: '{{database}}',
          },
          null,
          2,
        ),
      },
      {
        path: 'src/index.ts',
        content:
          '// Project: {{projectName}}\nconsole.log("Running on {{stack}} with {{framework}} and {{database}}");',
      },
      {
        path: 'config/{{projectName}}.env',
        content: 'APP_NAME={{projectName}}\nDB={{database}}',
      },
      {
        path: 'docker-compose.yml',
        content:
          '{{ if (it.hasExtra("docker")) { }}version: "3.8"\nservices:\n  app:\n    build: .{{ } }}',
      },
    ],
  };

  const inMemorySource: TemplateSource = {
    getTemplate: (_answer: Answer) => sampleTemplate,
  };

  it('generates the correct file list and properly substitutes placeholder content', async () => {
    const answer: Answer = AnswerSchema.parse({
      projectName: 'my-awesome-api',
      stack: 'node',
      framework: 'express',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'postgres',
      orm: 'prisma',
      extras: ['docker', 'env'],
    });

    const fileOps = await generate(answer, inMemorySource);

    expect(fileOps.length).toBeGreaterThanOrEqual(6);

    const packageJsonOp = fileOps.find((f) => f.path === 'package.json');
    expect(packageJsonOp).toBeDefined();
    const parsedPkg = JSON.parse(packageJsonOp!.content);
    expect(parsedPkg.name).toBe('my-awesome-api');
    expect(parsedPkg.stack).toBe('node');
    expect(parsedPkg.db).toBe('postgres');

    const indexTsOp = fileOps.find((f) => f.path === 'src/index.ts');
    expect(indexTsOp).toBeDefined();
    expect(indexTsOp!.content).toBe(
      '// Project: my-awesome-api\nconsole.log("Running on node with express and postgres");',
    );

    const envOp = fileOps.find((f) => f.path === 'config/my-awesome-api.env');
    expect(envOp).toBeDefined();
    expect(envOp!.content).toBe('APP_NAME=my-awesome-api\nDB=postgres');

    const dockerOp = fileOps.find((f) => f.path === 'docker-compose.yml');
    expect(dockerOp).toBeDefined();
    expect(dockerOp!.content).toContain('3.8');
  });

  it('throws a descriptive GeneratorError when no template matches', async () => {
    const emptySource: TemplateSource = {
      getTemplate: () => null as unknown as Template,
    };

    const answer: Answer = AnswerSchema.parse({
      projectName: 'missing-app',
      stack: 'python',
      framework: 'fastapi',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
      extras: [],
    });

    await expect(generate(answer, emptySource)).rejects.toThrow(GeneratorError);
    await expect(generate(answer, emptySource)).rejects.toThrow(
      /No compatible template found for stack: python, framework: fastapi/,
    );
  });

  it('throws a descriptive GeneratorError when template does not support the requested shape', async () => {
    const restrictedManifest = {
      ...sampleManifest,
      compatibleShapes: ['fullstack' as const],
    };

    const restrictedSource: TemplateSource = {
      getTemplate: () => ({
        manifest: restrictedManifest,
        files: sampleTemplate.files,
      }),
    };

    const answer: Answer = AnswerSchema.parse({
      projectName: 'incompatible-app',
      stack: 'node',
      framework: 'express',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
      extras: [],
    });

    await expect(generate(answer, restrictedSource)).rejects.toThrow(GeneratorError);
    await expect(generate(answer, restrictedSource)).rejects.toThrow(
      /does not support app shape "standalone"/,
    );
  });

  it('throws a descriptive GeneratorError when template does not support the requested database', async () => {
    const restrictedManifest = {
      ...sampleManifest,
      compatibleDatabases: ['mysql' as const],
    };

    const restrictedSource: TemplateSource = {
      getTemplate: () => ({
        manifest: restrictedManifest,
        files: sampleTemplate.files,
      }),
    };

    const answer: Answer = AnswerSchema.parse({
      projectName: 'incompatible-db-app',
      stack: 'node',
      framework: 'express',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'postgres',
      orm: 'prisma',
      extras: [],
    });

    await expect(generate(answer, restrictedSource)).rejects.toThrow(GeneratorError);
    await expect(generate(answer, restrictedSource)).rejects.toThrow(
      /does not support database "postgres"/,
    );
  });

  it('handles template without fragments gracefully', async () => {
    const noFragmentManifest = {
      ...sampleManifest,
      fragments: [],
    };

    const source: TemplateSource = {
      getTemplate: () => ({
        manifest: noFragmentManifest,
        files: [
          {
            path: 'index.js',
            content: 'console.log("hello");',
          },
        ],
      }),
    };

    const answer: Answer = AnswerSchema.parse({
      projectName: 'plain-app',
      stack: 'node',
      framework: 'express',
      appShape: 'standalone',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
      extras: [],
    });

    const fileOps = await generate(answer, source);
    expect(fileOps).toHaveLength(2); // index.js + README.md
    expect(fileOps[0].path).toBe('index.js');
    expect(fileOps[1].path).toBe('README.md');
  });

  it('generates a complete microservices project structure with gateway and downstream services', async () => {
    const microservicesAnswer: Answer = AnswerSchema.parse({
      projectName: 'pos-platform',
      stack: 'node',
      framework: 'express',
      appShape: 'microservices',
      architecture: 'layered',
      database: 'none',
      orm: 'none',
      extras: ['env'],
      gateway: {
        stack: 'node',
        framework: 'express',
        port: 8000,
      },
      services: [
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
          stack: 'node',
          framework: 'express',
          port: 8002,
          database: 'postgres',
          orm: 'prisma',
          extras: [],
        },
      ],
    });

    const fileOps = await generate(microservicesAnswer, inMemorySource);
    expect(fileOps.length).toBeGreaterThan(0);

    const paths = fileOps.map((f) => f.path);

    // Gateway files
    expect(paths).toContain('gateway/package.json');
    expect(paths).toContain('gateway/tsconfig.json');
    expect(paths).toContain('gateway/src/index.ts');
    expect(paths).toContain('gateway/.env.example');

    // Downstream services files
    expect(paths).toContain('services/auth-service/package.json');
    expect(paths).toContain('services/auth-service/src/index.ts');
    expect(paths).toContain('services/auth-service/.env.example');

    expect(paths).toContain('services/catalog-service/package.json');
    expect(paths).toContain('services/catalog-service/src/index.ts');
    expect(paths).toContain('services/catalog-service/.env.example');

    // Root files
    expect(paths).toContain('.env.example');
    expect(paths).toContain('README.md');

    // Verify Gateway code contains proxy routing
    const gatewayIndex = fileOps.find((f) => f.path === 'gateway/src/index.ts');
    expect(gatewayIndex?.content).toContain("app.use(\n  '/api/auth'");
    expect(gatewayIndex?.content).toContain("app.use(\n  '/api/catalog'");
    expect(gatewayIndex?.content).toContain('AUTH_SERVICE_URL');
    expect(gatewayIndex?.content).toContain('CATALOG_SERVICE_URL');

    // Verify root env contains service ports
    const rootEnv = fileOps.find((f) => f.path === '.env.example');
    expect(rootEnv?.content).toContain('GATEWAY_PORT=8000');
    expect(rootEnv?.content).toContain('AUTH_SERVICE_URL=http://localhost:8001');
    expect(rootEnv?.content).toContain('CATALOG_SERVICE_URL=http://localhost:8002');
  });
});
