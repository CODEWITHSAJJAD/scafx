import * as p from '@clack/prompts';
import {
  AnswerSchema,
  getAllowedArchitectures,
  getAllowedDatabases,
  getAllowedORMs,
  getAllowedMessageQueues,
  getDefaultPort,
  type Answer,
  type AppShape,
  type Architecture,
  type AuthScheme,
  type Database,
  type DatabaseConfig,
  type DatabaseHosting,
  type Extra,
  type Framework,
  type MessageQueue,
  type MigrationTool,
  type Orm,
  type RepositoryStructure,
  type Stack,
} from '@codewithsajjad01/core';
import pc from 'picocolors';

const ARCHITECTURE_LABELS: Record<Architecture, string> = {
  layered: 'Layered Architecture (Controllers -> Services -> Repositories)',
  clean: 'Clean / Hexagonal Architecture (Domain -> Application -> Infrastructure -> API)',
  'vertical-slice': 'Vertical Slices / Feature-First (Features isolated end-to-end)',
  'modular-monolith': 'Modular Architecture / Bounded Contexts',
  mvc: 'Model-View-Controller (MVC Pattern)',
  mvvm: 'Model-View-ViewModel (MVVM Pattern)',
  microservice: 'Microservices Service Node (Event-Driven / gRPC / HTTP)',
  atomic: 'Atomic Design (Atoms -> Molecules -> Organisms -> Templates)',
  'feature-first': 'Feature-First Architecture (Organized by business domain features)',
  none: 'Standard / Minimal Structure',
};

const DATABASE_LABELS: Record<Database, string> = {
  postgres: 'PostgreSQL',
  mysql: 'MySQL',
  mssql: 'Microsoft SQL Server (MSSQL)',
  mongodb: 'MongoDB (NoSQL Document Store)',
  sqlite: 'SQLite (Embedded file database)',
  none: 'None (No Database)',
};

const ORM_LABELS: Record<Orm, string> = {
  prisma: 'Prisma ORM (TypeScript-first schema & migrations)',
  drizzle: 'Drizzle ORM (Lightweight TypeScript SQL toolkit)',
  typeorm: 'TypeORM (TypeScript & JavaScript ORM for Node)',
  sqlalchemy: 'SQLAlchemy (Python SQL toolkit & ORM)',
  alembic: 'Alembic (Python database migration engine)',
  'django-orm': 'Django Built-in ORM & Migrations',
  tortoise: 'Tortoise ORM (Async Python ORM with Aerich migrations)',
  efcore: 'Entity Framework Core (.NET modern ORM)',
  dapper: 'Dapper (.NET high-performance micro-ORM)',
  mongoose: 'Mongoose (Node.js MongoDB object modeling)',
  motor: 'Motor (Async Python MongoDB driver)',
  pymongo: 'PyMongo (Synchronous Python MongoDB driver)',
  drift: 'Drift (Reactive persistence library for Flutter & Dart)',
  hive: 'Hive (Fast, lightweight key-value database for Flutter)',
  flyway: 'Flyway SQL Versioned Migrations',
  none: 'None / Plain SQL Drivers',
};

const MESSAGE_QUEUE_LABELS: Record<MessageQueue, string> = {
  none: 'None (No Message Queue)',
  rabbitmq: 'RabbitMQ (AMQP message broker)',
  kafka: 'Apache Kafka (Distributed event streaming)',
  'redis-queue': 'Redis Queue (BullMQ for Node / Celery for Python)',
  masstransit: 'MassTransit (.NET Distributed Application Framework / Bus)',
};

export async function promptInteractive(defaults?: Partial<Answer>): Promise<Answer> {
  p.intro(pc.bgCyan(pc.black(' scafx v0.3.2 - Polyglot Project Architect ')));

  // 1. Project Name
  const projectName =
    defaults?.projectName ??
    (await p.text({
      message: 'Project name:',
      placeholder: 'my-polyglot-app',
      defaultValue: 'my-polyglot-app',
      validate: (value) => {
        if (!value || value.trim().length === 0) return 'Project name is required';
        if (!/^(?:@[a-zA-Z0-9~-][a-zA-Z0-9._~-]*\/)?[a-zA-Z0-9~-][a-zA-Z0-9._~-]*$/.test(value)) {
          return 'Project name must be a valid directory name (alphanumeric, dashes, underscores)';
        }
      },
    }));

  if (p.isCancel(projectName)) {
    p.cancel('Scaffolding cancelled.');
    process.exit(0);
  }

  // 2. Application Target Shape
  type ShapeSelection =
    'standalone-backend' | 'standalone-frontend' | 'fullstack' | 'microservices';
  const shapeSelection = await p.select<ShapeSelection>({
    message: 'Select application target shape:',
    options: [
      {
        value: 'standalone-backend',
        label: 'Standalone Backend (Dedicated REST / GraphQL / gRPC API)',
      },
      {
        value: 'standalone-frontend',
        label: 'Standalone Frontend (Vite SPA, Next.js, or Flutter App)',
      },
      {
        value: 'fullstack',
        label: 'Full-Stack Application (Frontend + Backend in unified workspace)',
      },
      {
        value: 'microservices',
        label: 'Microservices Mesh (API Gateway + Isolated downstream services)',
      },
    ],
    initialValue: 'standalone-backend',
  });

  if (p.isCancel(shapeSelection)) {
    p.cancel('Scaffolding cancelled.');
    process.exit(0);
  }

  // 3. Repository Structure
  let repositoryStructure: RepositoryStructure = 'colocated-standalone';
  if (shapeSelection === 'fullstack' || shapeSelection === 'microservices') {
    const repoChoice = await p.select<RepositoryStructure>({
      message: 'Select repository workspace structure:',
      options: [
        {
          value: 'monorepo-isolated',
          label: 'Monorepo Workspace (Dedicated folders: frontend/ & backend/ or services/)',
        },
        {
          value: 'colocated-standalone',
          label: 'Colocated / Single Root Workspace',
        },
      ],
      initialValue: 'monorepo-isolated',
    });

    if (p.isCancel(repoChoice)) {
      p.cancel('Scaffolding cancelled.');
      process.exit(0);
    }
    repositoryStructure = repoChoice;
  }

  // 4. Ecosystem & Framework selection
  let stack: Stack = 'node';
  let framework: Framework = 'express';
  let appShape: AppShape = 'standalone';
  let frontend: { stack: Stack; framework: Framework; architecture?: Architecture } | undefined;
  let backend:
    | {
        stack: Stack;
        framework: Framework;
        architecture?: Architecture;
        database?: Database;
        orm?: Orm;
        databaseConfig?: DatabaseConfig;
        migrationTool?: MigrationTool;
        messageQueue?: MessageQueue;
        authScheme?: AuthScheme;
      }
    | undefined;
  let gateway: { stack: Stack; framework: Framework; port: number } | undefined;
  let services:
    | {
        name: string;
        stack: Stack;
        framework: Framework;
        architecture: Architecture;
        port: number;
        database: Database;
        orm: Orm;
        migrationTool: MigrationTool;
        messageQueue: MessageQueue;
        authScheme: AuthScheme;
        extras: Extra[];
      }[]
    | undefined;

  if (shapeSelection === 'standalone-backend') {
    appShape = 'standalone';
    const chosenStack = await p.select<Stack>({
      message: 'Select backend ecosystem / runtime:',
      options: [
        { value: 'node', label: 'Node.js (TypeScript / JavaScript)' },
        { value: 'python', label: 'Python (Modern 3.11+ / Pytest)' },
        { value: 'dotnet', label: '.NET 8 (C# / Modern Web SDK)' },
      ],
      initialValue: 'node',
    });
    if (p.isCancel(chosenStack)) {
      p.cancel('Scaffolding cancelled.');
      process.exit(0);
    }
    stack = chosenStack;

    const frameworkMap: Record<string, { value: Framework; label: string }[]> = {
      node: [
        { value: 'express', label: 'Express.js (Fast, unopinionated, minimalist web framework)' },
        { value: 'fastify', label: 'Fastify (High-performance, low-overhead web framework)' },
        { value: 'nestjs', label: 'NestJS (Enterprise TypeScript architectural framework)' },
      ],
      python: [
        { value: 'fastapi', label: 'FastAPI (High performance, OpenAPI standard, async Python)' },
        { value: 'flask', label: 'Flask (Lightweight WSGI micro-framework)' },
        { value: 'django', label: 'Django (Batteries-included full-featured framework)' },
      ],
      dotnet: [
        { value: 'webapi', label: 'ASP.NET Core Web API (Controllers pattern)' },
        {
          value: 'minimal-api',
          label: 'ASP.NET Core Minimal API (High-performance lightweight routes)',
        },
        { value: 'mvc', label: 'ASP.NET Core MVC (Model-View-Controller with Razor views)' },
      ],
    };

    const chosenFramework = await p.select<Framework>({
      message: 'Select backend framework:',
      options: frameworkMap[stack] || [{ value: 'none', label: 'Standard' }],
      initialValue: frameworkMap[stack][0]?.value ?? 'none',
    });
    if (p.isCancel(chosenFramework)) {
      p.cancel('Scaffolding cancelled.');
      process.exit(0);
    }
    framework = chosenFramework;
  } else if (shapeSelection === 'standalone-frontend') {
    appShape = 'standalone';
    const chosenStack = await p.select<Stack>({
      message: 'Select frontend ecosystem:',
      options: [
        { value: 'react', label: 'React (TypeScript / Web)' },
        { value: 'flutter', label: 'Flutter (Dart / Cross-Platform Mobile & Web)' },
      ],
      initialValue: 'react',
    });
    if (p.isCancel(chosenStack)) {
      p.cancel('Scaffolding cancelled.');
      process.exit(0);
    }
    stack = chosenStack;

    if (stack === 'react') {
      const chosenFramework = await p.select<Framework>({
        message: 'Select React framework:',
        options: [
          { value: 'vite', label: 'Vite SPA (Ultra-fast modern Single Page Application)' },
          {
            value: 'nextjs',
            label: 'Next.js App Router (Full-stack React framework with SSR/SSG)',
          },
        ],
        initialValue: 'vite',
      });
      if (p.isCancel(chosenFramework)) {
        p.cancel('Scaffolding cancelled.');
        process.exit(0);
      }
      framework = chosenFramework;
    } else {
      framework = 'none';
    }
  } else if (shapeSelection === 'fullstack') {
    appShape = 'fullstack';
    stack = 'react';
    framework = 'vite';

    const fFramework = await p.select<Framework>({
      message: 'Select frontend framework:',
      options: [
        { value: 'vite', label: 'React + Vite SPA' },
        { value: 'nextjs', label: 'Next.js App Router' },
      ],
      initialValue: 'vite',
    });
    if (p.isCancel(fFramework)) {
      p.cancel('Scaffolding cancelled.');
      process.exit(0);
    }
    frontend = { stack: 'react', framework: fFramework };

    const bStack = await p.select<Stack>({
      message: 'Select backend ecosystem:',
      options: [
        { value: 'node', label: 'Node.js (TypeScript)' },
        { value: 'python', label: 'Python' },
        { value: 'dotnet', label: '.NET 8 (C#)' },
      ],
      initialValue: 'node',
    });
    if (p.isCancel(bStack)) {
      p.cancel('Scaffolding cancelled.');
      process.exit(0);
    }

    const bFrameworkMap: Record<string, { value: Framework; label: string }[]> = {
      node: [
        { value: 'express', label: 'Express.js' },
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
        { value: 'minimal-api', label: 'ASP.NET Core Minimal API' },
        { value: 'mvc', label: 'ASP.NET Core MVC' },
      ],
    };

    const bFramework = await p.select<Framework>({
      message: 'Select backend framework:',
      options: bFrameworkMap[bStack] || [{ value: 'none', label: 'Standard' }],
      initialValue: bFrameworkMap[bStack][0]?.value ?? 'none',
    });
    if (p.isCancel(bFramework)) {
      p.cancel('Scaffolding cancelled.');
      process.exit(0);
    }
    backend = { stack: bStack, framework: bFramework };
  } else if (shapeSelection === 'microservices') {
    appShape = 'microservices';
    stack = 'node';
    framework = 'express';

    const gatewayPort = await p.text({
      message: 'API Gateway Port:',
      defaultValue: '8000',
      placeholder: '8000',
      validate: (v) => (!v || isNaN(Number(v)) ? 'Port must be a valid number' : undefined),
    });
    if (p.isCancel(gatewayPort)) {
      p.cancel('Scaffolding cancelled.');
      process.exit(0);
    }

    gateway = {
      stack: 'node',
      framework: 'express',
      port: Number(gatewayPort),
    };

    services = [
      {
        name: 'auth-service',
        stack: 'node',
        framework: 'express',
        architecture: 'layered',
        port: 8001,
        database: 'postgres',
        orm: 'prisma',
        migrationTool: 'native',
        messageQueue: 'none',
        authScheme: 'jwt',
        extras: ['auth'],
      },
      {
        name: 'catalog-service',
        stack: 'python',
        framework: 'fastapi',
        architecture: 'layered',
        port: 8002,
        database: 'mongodb',
        orm: 'motor',
        migrationTool: 'none',
        messageQueue: 'rabbitmq',
        authScheme: 'jwt',
        extras: [],
      },
      {
        name: 'inventory-service',
        stack: 'dotnet',
        framework: 'webapi',
        architecture: 'clean',
        port: 8003,
        database: 'mssql',
        orm: 'efcore',
        migrationTool: 'native',
        messageQueue: 'masstransit',
        authScheme: 'jwt',
        extras: [],
      },
    ];
  }

  // 5. Architecture Coding Style (filtered dynamically)
  const targetStack = backend?.stack ?? stack;
  const targetFramework = backend?.framework ?? framework;
  const allowedArchs = getAllowedArchitectures(targetStack, targetFramework);

  const architecture =
    defaults?.architecture ??
    (await p.select<Architecture>({
      message: `Select architectural coding style for ${pc.cyan(targetStack)} (${pc.cyan(targetFramework)}):`,
      options: allowedArchs.map((arch) => ({
        value: arch,
        label: ARCHITECTURE_LABELS[arch] ?? arch,
      })),
      initialValue: allowedArchs[0] ?? 'layered',
    }));

  if (p.isCancel(architecture)) {
    p.cancel('Scaffolding cancelled.');
    process.exit(0);
  }

  // 6. Database Selection & Hosting Configuration
  const allowedDatabases = getAllowedDatabases(targetStack);
  const database =
    defaults?.database ??
    (await p.select<Database>({
      message: `Select primary database:`,
      options: allowedDatabases.map((db) => ({
        value: db,
        label: DATABASE_LABELS[db] ?? db,
      })),
      initialValue: allowedDatabases[0] ?? 'postgres',
    }));

  if (p.isCancel(database)) {
    p.cancel('Scaffolding cancelled.');
    process.exit(0);
  }

  let databaseHosting: DatabaseHosting = 'local-native';
  let databaseConfig: DatabaseConfig | undefined;

  if (database !== 'none') {
    const hostingChoice = await p.select<DatabaseHosting>({
      message: `Select database hosting target:`,
      options: [
        {
          value: 'local-native',
          label:
            'Local Native Server (Installed on OS: pgAdmin, SSMS, MongoDB Compass, MySQL Workbench)',
        },
        {
          value: 'local-docker',
          label: 'Local Docker Container (Automated docker-compose service)',
        },
        {
          value: 'cloud-supabase',
          label: 'Supabase (Cloud Managed Postgres BaaS)',
        },
        {
          value: 'cloud-neon',
          label: 'Neon (Serverless Cloud Postgres)',
        },
        {
          value: 'cloud-atlas',
          label: 'MongoDB Atlas (Managed Cloud Cluster)',
        },
        {
          value: 'cloud-firebase',
          label: 'Google Firebase / Firestore',
        },
        {
          value: 'cloud-cloudflare',
          label: 'Cloudflare D1 / Hyperdrive',
        },
      ],
      initialValue: 'local-native',
    });

    if (p.isCancel(hostingChoice)) {
      p.cancel('Scaffolding cancelled.');
      process.exit(0);
    }
    databaseHosting = hostingChoice;

    if (databaseHosting === 'local-native') {
      const defaultPort = getDefaultPort(database);
      const host = await p.text({
        message: 'Database Host:',
        defaultValue: 'localhost',
        placeholder: 'localhost',
      });
      if (p.isCancel(host)) {
        p.cancel('Scaffolding cancelled.');
        process.exit(0);
      }

      const port = await p.text({
        message: 'Database Port:',
        defaultValue: String(defaultPort),
        placeholder: String(defaultPort),
      });
      if (p.isCancel(port)) {
        p.cancel('Scaffolding cancelled.');
        process.exit(0);
      }

      const dbName = await p.text({
        message: 'Database Name:',
        defaultValue: `${projectName.toString().replace(/[^a-zA-Z0-9_]/g, '_')}_db`,
        placeholder: 'my_app_db',
      });
      if (p.isCancel(dbName)) {
        p.cancel('Scaffolding cancelled.');
        process.exit(0);
      }

      const defaultUser =
        database === 'postgres'
          ? 'postgres'
          : database === 'mysql'
            ? 'root'
            : database === 'mssql'
              ? 'sa'
              : 'admin';
      const user = await p.text({
        message: 'Database Username:',
        defaultValue: defaultUser,
        placeholder: defaultUser,
      });
      if (p.isCancel(user)) {
        p.cancel('Scaffolding cancelled.');
        process.exit(0);
      }

      const password = await p.password({
        message: 'Database Password:',
        mask: '*',
      });
      if (p.isCancel(password)) {
        p.cancel('Scaffolding cancelled.');
        process.exit(0);
      }

      databaseConfig = {
        hosting: 'local-native',
        host: host.toString() || 'localhost',
        port: Number(port) || defaultPort,
        databaseName: dbName.toString() || 'app_db',
        user: user.toString() || defaultUser,
        password: password.toString() || 'password',
      };
    } else if (databaseHosting.startsWith('cloud-')) {
      const connectionString = await p.text({
        message:
          'Cloud Database Connection String / URI / Project Ref (leave empty for placeholder):',
        placeholder: 'postgres://user:pass@ep-cool-cloud.neon.tech/neondb?sslmode=require',
        defaultValue: '',
      });
      if (p.isCancel(connectionString)) {
        p.cancel('Scaffolding cancelled.');
        process.exit(0);
      }

      databaseConfig = {
        hosting: databaseHosting,
        host: 'cloud-host',
        port: getDefaultPort(database),
        databaseName: 'app_db',
        user: 'cloud_user',
        password: 'cloud_password',
        connectionString: connectionString.toString(),
      };
    } else {
      // local-docker
      databaseConfig = {
        hosting: 'local-docker',
        host: 'localhost',
        port: getDefaultPort(database),
        databaseName: `${projectName.toString().replace(/[^a-zA-Z0-9_]/g, '_')}_db`,
        user: 'postgres',
        password: 'postgres_password',
      };
    }
  }

  // 7. ORM / Query Builder Selection
  const allowedORMs = getAllowedORMs(targetStack, database);
  const orm =
    defaults?.orm ??
    (await p.select<Orm>({
      message: 'Select ORM / Query Builder:',
      options: allowedORMs.map((o) => ({
        value: o,
        label: ORM_LABELS[o] ?? o,
      })),
      initialValue: allowedORMs[0] ?? 'none',
    }));

  if (p.isCancel(orm)) {
    p.cancel('Scaffolding cancelled.');
    process.exit(0);
  }

  // 8. Database Migrations Engine
  let migrationTool: MigrationTool = 'none';
  if (database !== 'none' && database !== 'mongodb') {
    const migChoice = await p.select<MigrationTool>({
      message: 'Select database migration engine:',
      options: [
        {
          value: 'native',
          label: 'Native ORM Migrations (Prisma Migrate / Alembic / EF Core Migrations / Django)',
        },
        {
          value: 'flyway',
          label: 'Universal SQL Migrations (Flyway versioned V1__initial_schema.sql)',
        },
        {
          value: 'none',
          label: 'None (No migration tool configured)',
        },
      ],
      initialValue: 'native',
    });

    if (p.isCancel(migChoice)) {
      p.cancel('Scaffolding cancelled.');
      process.exit(0);
    }
    migrationTool = migChoice;
  }

  // 9. Message Queue / Event Bus
  const allowedQueues = getAllowedMessageQueues(targetStack);
  let messageQueue: MessageQueue = 'none';
  if (allowedQueues.length > 1) {
    const queueChoice = await p.select<MessageQueue>({
      message: 'Select Message Queue / Event Streaming:',
      options: allowedQueues.map((q) => ({
        value: q,
        label: MESSAGE_QUEUE_LABELS[q] ?? q,
      })),
      initialValue: 'none',
    });

    if (p.isCancel(queueChoice)) {
      p.cancel('Scaffolding cancelled.');
      process.exit(0);
    }
    messageQueue = queueChoice;
  }

  // 10. Auth Scheme
  let authScheme: AuthScheme = 'jwt';
  if (shapeSelection !== 'standalone-frontend') {
    const authChoice = await p.select<AuthScheme>({
      message: 'Select authentication scheme:',
      options: [
        { value: 'jwt', label: 'JWT Bearer Token Authentication (Stateless & Scalable)' },
        { value: 'oauth', label: 'OAuth2 / OpenID Connect (Social Logins & SSO)' },
        { value: 'session', label: 'Session & Cookie Authentication (Stateful)' },
        { value: 'supabase-auth', label: 'Supabase Auth (Managed Authentication)' },
        { value: 'firebase-auth', label: 'Firebase Authentication' },
        { value: 'none', label: 'None (No built-in authentication)' },
      ],
      initialValue: 'jwt',
    });

    if (p.isCancel(authChoice)) {
      p.cancel('Scaffolding cancelled.');
      process.exit(0);
    }
    authScheme = authChoice;
  }

  // 11. Extras Multi-Select
  const extras =
    defaults?.extras ??
    (await p.multiselect<Extra>({
      message: 'Select developer tooling and extras to configure:',
      options: [
        { value: 'docker', label: 'Docker + Docker Compose (Multi-stage containerization)' },
        { value: 'ci', label: 'GitHub Actions CI workflow' },
        { value: 'lint', label: 'Code Linter & Formatter configuration' },
        { value: 'testing', label: 'Automated Test Suite (Vitest / Pytest / xUnit)' },
        { value: 'env', label: '.env environment variables template' },
        { value: 'git', label: 'Initialize Git repository & commit' },
      ],
      required: false,
      initialValues: ['env', 'git'],
    }));

  if (p.isCancel(extras)) {
    p.cancel('Scaffolding cancelled.');
    process.exit(0);
  }

  // Enrich backend / frontend models with selected configs
  if (backend) {
    backend.architecture = architecture;
    backend.database = database;
    backend.orm = orm;
    backend.databaseConfig = databaseConfig;
    backend.migrationTool = migrationTool;
    backend.messageQueue = messageQueue;
    backend.authScheme = authScheme;
  }

  if (frontend) {
    frontend.architecture = architecture;
  }

  const rawAnswer = {
    projectName: projectName as string,
    stack,
    framework,
    appShape,
    repositoryStructure,
    architecture,
    database,
    databaseHosting,
    ...(databaseConfig ? { databaseConfig } : {}),
    orm,
    migrationTool,
    messageQueue,
    authScheme,
    extras: (extras as Extra[]) || [],
    ...(frontend ? { frontend } : {}),
    ...(backend ? { backend } : {}),
    ...(gateway ? { gateway } : {}),
    ...(services ? { services } : {}),
  };

  return AnswerSchema.parse(rawAnswer);
}
