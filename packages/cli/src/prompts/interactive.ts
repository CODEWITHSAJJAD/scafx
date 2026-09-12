import * as p from '@clack/prompts';
import {
  AnswerSchema,
  type Answer,
  type AppShape,
  type Architecture,
  type Database,
  type Extra,
  type Framework,
  type Orm,
  type Stack,
} from '@project-scaffolder/core';

export async function promptInteractive(defaults?: Partial<Answer>): Promise<Answer> {
  p.intro('Universal Project Scaffolder');

  const projectName =
    defaults?.projectName ??
    (await p.text({
      message: 'Project name:',
      placeholder: 'my-app',
      defaultValue: 'my-app',
      validate: (value) => {
        if (!value || value.trim().length === 0) return 'Project name is required';
        if (!/^(?:@[a-zA-Z0-9~-][a-zA-Z0-9._~-]*\/)?[a-zA-Z0-9~-][a-zA-Z0-9._~-]*$/.test(value)) {
          return 'Project name must be a valid directory name';
        }
      },
    }));

  if (p.isCancel(projectName)) {
    p.cancel('Scaffolding cancelled.');
    process.exit(0);
  }

  const stack =
    defaults?.stack ??
    (await p.select<Stack>({
      message: 'Select ecosystem / stack:',
      options: [
        { value: 'node', label: 'Node.js (TypeScript / JavaScript)' },
        { value: 'python', label: 'Python' },
        { value: 'dotnet', label: '.NET (C#)' },
        { value: 'react', label: 'React' },
        { value: 'flutter', label: 'Flutter' },
      ],
      initialValue: 'node',
    }));

  if (p.isCancel(stack)) {
    p.cancel('Scaffolding cancelled.');
    process.exit(0);
  }

  // Framework options based on stack
  const frameworkOptions: Record<Stack, { value: Framework; label: string }[]> = {
    node: [
      { value: 'express', label: 'Express' },
      { value: 'fastify', label: 'Fastify' },
      { value: 'nestjs', label: 'NestJS' },
    ],
    python: [
      { value: 'fastapi', label: 'FastAPI' },
      { value: 'flask', label: 'Flask' },
      { value: 'django', label: 'Django' },
    ],
    dotnet: [
      { value: 'webapi', label: 'ASP.NET Core Web API' },
      { value: 'mvc', label: 'ASP.NET Core MVC' },
    ],
    react: [
      { value: 'vite', label: 'Vite SPA' },
      { value: 'nextjs', label: 'Next.js' },
    ],
    flutter: [{ value: 'none', label: 'Flutter Standard' }],
  };

  const framework =
    defaults?.framework ??
    (await p.select<Framework>({
      message: 'Select framework:',
      options: frameworkOptions[stack] || [{ value: 'none', label: 'Standard' }],
      initialValue: frameworkOptions[stack][0]?.value ?? 'none',
    }));

  if (p.isCancel(framework)) {
    p.cancel('Scaffolding cancelled.');
    process.exit(0);
  }

  const appShape =
    defaults?.appShape ??
    (await p.select<AppShape>({
      message: 'Select app shape:',
      options: [
        { value: 'standalone', label: 'Standalone' },
        { value: 'frontend-backend', label: 'Frontend + Backend (separate)' },
        { value: 'fullstack', label: 'Full-stack (same repository)' },
        { value: 'microservices', label: 'Microservices (gateway + services)' },
      ],
      initialValue: 'standalone',
    }));

  if (p.isCancel(appShape)) {
    p.cancel('Scaffolding cancelled.');
    process.exit(0);
  }

  const architecture =
    defaults?.architecture ??
    (await p.select<Architecture>({
      message: 'Select architecture style:',
      options: [
        { value: 'layered', label: 'Layered (routes / controllers / services)' },
        { value: 'clean', label: 'Clean / Hexagonal' },
        { value: 'feature-first', label: 'Feature-first' },
        { value: 'modular-monolith', label: 'Modular Monolith' },
      ],
      initialValue: 'layered',
    }));

  if (p.isCancel(architecture)) {
    p.cancel('Scaffolding cancelled.');
    process.exit(0);
  }

  const database =
    defaults?.database ??
    (await p.select<Database>({
      message: 'Select database:',
      options: [
        { value: 'postgres', label: 'PostgreSQL' },
        { value: 'mysql', label: 'MySQL' },
        { value: 'sqlite', label: 'SQLite' },
        { value: 'mongodb', label: 'MongoDB' },
        { value: 'none', label: 'None' },
      ],
      initialValue: 'postgres',
    }));

  if (p.isCancel(database)) {
    p.cancel('Scaffolding cancelled.');
    process.exit(0);
  }

  // Suggest default ORM based on Stack + DB
  const defaultOrm: Orm = database === 'none' ? 'none' : stack === 'node' ? 'prisma' : 'none';

  const orm =
    defaults?.orm ??
    (await p.select<Orm>({
      message: 'Select ORM / query builder:',
      options: [
        { value: 'prisma', label: 'Prisma' },
        { value: 'sqlalchemy', label: 'SQLAlchemy + Alembic' },
        { value: 'efcore', label: 'EF Core' },
        { value: 'mongoose', label: 'Mongoose' },
        { value: 'none', label: 'None / Plain SQL' },
      ],
      initialValue: defaultOrm,
    }));

  if (p.isCancel(orm)) {
    p.cancel('Scaffolding cancelled.');
    process.exit(0);
  }

  const extras =
    defaults?.extras ??
    (await p.multiselect<Extra>({
      message: 'Select extra configuration and boilerplate:',
      options: [
        { value: 'docker', label: 'Docker + Docker Compose' },
        { value: 'ci', label: 'GitHub Actions CI workflow' },
        { value: 'lint', label: 'ESLint / Prettier configuration' },
        { value: 'testing', label: 'Vitest / Unit test suite' },
        { value: 'env', label: '.env template file' },
        { value: 'git', label: 'Git init + initial commit' },
      ],
      required: false,
      initialValues: ['env', 'git'],
    }));

  if (p.isCancel(extras)) {
    p.cancel('Scaffolding cancelled.');
    process.exit(0);
  }

  const rawAnswer = {
    projectName: projectName as string,
    stack,
    framework,
    appShape,
    architecture,
    database,
    orm,
    extras: (extras as Extra[]) || [],
  };

  return AnswerSchema.parse(rawAnswer);
}
