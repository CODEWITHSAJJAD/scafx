import {
  Stack,
  Framework,
  Architecture,
  Database,
  Orm,
  MessageQueue,
  MigrationTool,
} from './answer.js';

export interface StackCapability {
  allowedFrameworks: Framework[];
  allowedArchitectures: Record<Framework, Architecture[]>;
  allowedDatabases: Database[];
  allowedORMs: Record<Database, Orm[]>;
  allowedMessageQueues: MessageQueue[];
  allowedMigrations: MigrationTool[];
}

export const ECOSYSTEM_CAPABILITIES: Record<Stack, StackCapability> = {
  node: {
    allowedFrameworks: ['express', 'fastify', 'nestjs'],
    allowedArchitectures: {
      express: ['layered', 'clean', 'vertical-slice', 'mvc', 'modular-monolith', 'microservice'],
      fastify: ['layered', 'clean', 'vertical-slice', 'mvc', 'modular-monolith', 'microservice'],
      nestjs: ['layered', 'clean', 'vertical-slice', 'modular-monolith', 'microservice'],
      flask: [],
      fastapi: [],
      django: [],
      webapi: [],
      mvc: [],
      'minimal-api': [],
      blazor: [],
      maui: [],
      vite: [],
      nextjs: [],
      flutter: [],
      none: [],
    },
    allowedDatabases: ['postgres', 'mysql', 'mssql', 'mongodb', 'sqlite', 'none'],
    allowedORMs: {
      postgres: ['prisma', 'drizzle', 'typeorm', 'none'],
      mysql: ['prisma', 'drizzle', 'typeorm', 'none'],
      mssql: ['prisma', 'typeorm', 'none'],
      mongodb: ['mongoose', 'prisma', 'none'],
      sqlite: ['prisma', 'drizzle', 'typeorm', 'none'],
      none: ['none'],
    },
    allowedMessageQueues: ['rabbitmq', 'kafka', 'redis-queue', 'none'],
    allowedMigrations: ['native', 'flyway', 'atlas', 'none'],
  },
  python: {
    allowedFrameworks: ['fastapi', 'flask', 'django'],
    allowedArchitectures: {
      fastapi: ['layered', 'clean', 'vertical-slice', 'mvc', 'modular-monolith', 'microservice'],
      flask: ['layered', 'clean', 'vertical-slice', 'mvc', 'modular-monolith', 'microservice'],
      django: ['mvc', 'layered', 'clean', 'vertical-slice', 'modular-monolith', 'microservice'],
      express: [],
      fastify: [],
      nestjs: [],
      webapi: [],
      mvc: [],
      'minimal-api': [],
      blazor: [],
      maui: [],
      vite: [],
      nextjs: [],
      flutter: [],
      none: [],
    },
    allowedDatabases: ['postgres', 'mysql', 'mssql', 'mongodb', 'sqlite', 'none'],
    allowedORMs: {
      postgres: ['sqlalchemy', 'alembic', 'tortoise', 'none'],
      mysql: ['sqlalchemy', 'alembic', 'tortoise', 'none'],
      mssql: ['sqlalchemy', 'alembic', 'none'],
      mongodb: ['motor', 'pymongo', 'none'],
      sqlite: ['sqlalchemy', 'alembic', 'tortoise', 'none'],
      none: ['none'],
    },
    allowedMessageQueues: ['redis-queue', 'rabbitmq', 'kafka', 'none'],
    allowedMigrations: ['native', 'flyway', 'atlas', 'none'],
  },
  dotnet: {
    allowedFrameworks: ['webapi', 'mvc', 'minimal-api', 'blazor', 'maui'],
    allowedArchitectures: {
      webapi: ['clean', 'vertical-slice', 'layered', 'mvc', 'mvvm', 'modular-monolith', 'microservice'],
      mvc: ['mvc', 'layered', 'clean'],
      'minimal-api': ['clean', 'vertical-slice', 'layered', 'microservice'],
      blazor: ['mvvm', 'clean', 'layered', 'mvc'],
      maui: ['mvvm', 'clean', 'layered'],
      express: [],
      fastify: [],
      nestjs: [],
      fastapi: [],
      flask: [],
      django: [],
      vite: [],
      nextjs: [],
      flutter: [],
      none: [],
    },
    allowedDatabases: ['mssql', 'postgres', 'mysql', 'sqlite', 'mongodb', 'none'],
    allowedORMs: {
      mssql: ['efcore', 'dapper', 'none'],
      postgres: ['efcore', 'dapper', 'none'],
      mysql: ['efcore', 'dapper', 'none'],
      sqlite: ['efcore', 'dapper', 'none'],
      mongodb: ['motor', 'none'],
      none: ['none'],
    },
    allowedMessageQueues: ['masstransit', 'rabbitmq', 'kafka', 'none'],
    allowedMigrations: ['native', 'flyway', 'none'],
  },
  react: {
    allowedFrameworks: ['vite', 'nextjs'],
    allowedArchitectures: {
      vite: ['feature-first', 'mvvm', 'atomic', 'clean', 'layered'],
      nextjs: ['feature-first', 'layered', 'clean', 'mvc', 'atomic'],
      express: [],
      fastify: [],
      nestjs: [],
      fastapi: [],
      flask: [],
      django: [],
      webapi: [],
      mvc: [],
      'minimal-api': [],
      blazor: [],
      maui: [],
      flutter: [],
      none: [],
    },
    allowedDatabases: ['none'],
    allowedORMs: {
      postgres: ['none'],
      mysql: ['none'],
      mssql: ['none'],
      mongodb: ['none'],
      sqlite: ['none'],
      none: ['none'],
    },
    allowedMessageQueues: ['none'],
    allowedMigrations: ['none'],
  },
  flutter: {
    allowedFrameworks: ['flutter', 'none'],
    allowedArchitectures: {
      flutter: ['feature-first', 'mvvm', 'clean', 'layered'],
      none: ['feature-first', 'mvvm', 'clean', 'layered'],
      express: [],
      fastify: [],
      nestjs: [],
      fastapi: [],
      flask: [],
      django: [],
      webapi: [],
      mvc: [],
      'minimal-api': [],
      blazor: [],
      maui: [],
      vite: [],
      nextjs: [],
    },
    allowedDatabases: ['sqlite', 'none'],
    allowedORMs: {
      sqlite: ['drift', 'none'],
      postgres: ['none'],
      mysql: ['none'],
      mssql: ['none'],
      mongodb: ['none'],
      none: ['drift', 'hive', 'none'],
    },
    allowedMessageQueues: ['none'],
    allowedMigrations: ['native', 'none'],
  },
};

export function getAllowedFrameworks(stack: Stack): Framework[] {
  return ECOSYSTEM_CAPABILITIES[stack]?.allowedFrameworks || [];
}

export function getAllowedArchitectures(stack: Stack, framework: Framework): Architecture[] {
  const map = ECOSYSTEM_CAPABILITIES[stack]?.allowedArchitectures;
  if (!map) return ['layered'];
  const archs = map[framework];
  if (archs && archs.length > 0) return archs;
  return ['layered'];
}

export function getAllowedDatabases(stack: Stack): Database[] {
  return ECOSYSTEM_CAPABILITIES[stack]?.allowedDatabases || ['none'];
}

export function getAllowedORMs(stack: Stack, database: Database): Orm[] {
  return ECOSYSTEM_CAPABILITIES[stack]?.allowedORMs[database] || ['none'];
}

export function getAllowedMessageQueues(stack: Stack): MessageQueue[] {
  return ECOSYSTEM_CAPABILITIES[stack]?.allowedMessageQueues || ['none'];
}

export function getAllowedMigrations(stack: Stack): MigrationTool[] {
  return ECOSYSTEM_CAPABILITIES[stack]?.allowedMigrations || ['none'];
}

export function getDefaultPort(database: Database): number {
  switch (database) {
    case 'postgres':
      return 5432;
    case 'mysql':
      return 3306;
    case 'mssql':
      return 1433;
    case 'mongodb':
      return 27017;
    default:
      return 5432;
  }
}
