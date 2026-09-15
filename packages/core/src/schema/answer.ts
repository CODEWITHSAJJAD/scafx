import { z } from 'zod';

export const StackEnum = z.enum(['node', 'python', 'dotnet', 'react', 'flutter']);
export type Stack = z.infer<typeof StackEnum>;

export const FrameworkEnum = z.enum([
  // Node
  'express',
  'fastify',
  'nestjs',
  // Python
  'fastapi',
  'flask',
  'django',
  // .NET
  'webapi',
  'mvc',
  'minimal-api',
  'blazor',
  'maui',
  // React
  'vite',
  'nextjs',
  // Flutter / None
  'flutter',
  'none',
]);
export type Framework = z.infer<typeof FrameworkEnum>;

export const AppShapeEnum = z.enum([
  'standalone',
  'frontend-backend',
  'fullstack',
  'microservices',
]);
export type AppShape = z.infer<typeof AppShapeEnum>;

export const RepositoryStructureEnum = z.enum([
  'monorepo-isolated',
  'colocated-standalone',
]);
export type RepositoryStructure = z.infer<typeof RepositoryStructureEnum>;

export const ArchitectureEnum = z.enum([
  'layered',
  'clean',
  'vertical-slice',
  'feature-first',
  'mvc',
  'mvvm',
  'microservice',
  'atomic',
  'modular-monolith',
  'none',
]);
export type Architecture = z.infer<typeof ArchitectureEnum>;

export const DatabaseEnum = z.enum([
  'postgres',
  'mysql',
  'mssql',
  'mongodb',
  'sqlite',
  'none',
]);
export type Database = z.infer<typeof DatabaseEnum>;

export const DatabaseHostingEnum = z.enum([
  'local-native',
  'local-docker',
  'cloud-supabase',
  'cloud-neon',
  'cloud-atlas',
  'cloud-firebase',
  'cloud-cloudflare',
  'none',
]);
export type DatabaseHosting = z.infer<typeof DatabaseHostingEnum>;

export const DatabaseConfigSchema = z.object({
  hosting: DatabaseHostingEnum.default('local-docker'),
  host: z.string().default('localhost'),
  port: z.number().int().default(5432),
  databaseName: z.string().default('app_db'),
  user: z.string().default('postgres'),
  password: z.string().default('postgres'),
  connectionString: z.string().optional(),
  cloudUrl: z.string().optional(),
  apiKey: z.string().optional(),
});
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

export const OrmEnum = z.enum([
  'prisma',
  'drizzle',
  'typeorm',
  'sqlalchemy',
  'alembic',
  'django-orm',
  'tortoise',
  'efcore',
  'dapper',
  'mongoose',
  'motor',
  'pymongo',
  'drift',
  'hive',
  'flyway',
  'none',
]);
export type Orm = z.infer<typeof OrmEnum>;

export const MigrationToolEnum = z.enum([
  'native',
  'flyway',
  'atlas',
  'none',
]);
export type MigrationTool = z.infer<typeof MigrationToolEnum>;

export const MessageQueueEnum = z.enum([
  'rabbitmq',
  'kafka',
  'redis-queue',
  'masstransit',
  'none',
]);
export type MessageQueue = z.infer<typeof MessageQueueEnum>;

export const AuthSchemeEnum = z.enum([
  'jwt',
  'session',
  'oauth',
  'supabase-auth',
  'firebase-auth',
  'none',
]);
export type AuthScheme = z.infer<typeof AuthSchemeEnum>;

export const ExtraEnum = z.enum([
  'auth',
  'docker',
  'ci',
  'lint',
  'testing',
  'env',
  'git',
  'swagger',
  'rabbitmq',
  'kafka',
  'redis-queue',
]);
export type Extra = z.infer<typeof ExtraEnum>;

export const SubStackSchema = z.object({
  stack: StackEnum,
  framework: FrameworkEnum,
  architecture: ArchitectureEnum.default('layered'),
  database: DatabaseEnum.default('none'),
  databaseConfig: DatabaseConfigSchema.optional(),
  orm: OrmEnum.default('none'),
  migrationTool: MigrationToolEnum.default('native'),
  messageQueue: MessageQueueEnum.default('none'),
  authScheme: AuthSchemeEnum.default('none'),
});
export type SubStack = z.infer<typeof SubStackSchema>;

export const ServiceDefinitionSchema = z.object({
  name: z
    .string()
    .min(1, 'Service name is required')
    .regex(/^[a-zA-Z0-9~_-]+$/, 'Service name must be alphanumeric with hyphens or underscores'),
  stack: StackEnum,
  framework: FrameworkEnum,
  architecture: ArchitectureEnum.default('microservice'),
  port: z.number().int().positive(),
  database: DatabaseEnum.default('none'),
  databaseConfig: DatabaseConfigSchema.optional(),
  orm: OrmEnum.default('none'),
  migrationTool: MigrationToolEnum.default('native'),
  messageQueue: MessageQueueEnum.default('none'),
  authScheme: AuthSchemeEnum.default('none'),
  extras: z.array(ExtraEnum).default([]),
});
export type ServiceDefinition = z.infer<typeof ServiceDefinitionSchema>;

export const GatewayDefinitionSchema = z.object({
  stack: StackEnum.default('node'),
  framework: FrameworkEnum.default('express'),
  port: z.number().int().positive().default(8000),
});
export type GatewayDefinition = z.infer<typeof GatewayDefinitionSchema>;

export const AnswerSchema = z.object({
  projectName: z
    .string()
    .min(1, 'Project name is required')
    .regex(
      /^(?:@[a-zA-Z0-9~-][a-zA-Z0-9._~-]*\/)?[a-zA-Z0-9~-][a-zA-Z0-9._~-]*$/,
      'Project name must be a valid directory and package identifier',
    ),
  stack: StackEnum,
  framework: FrameworkEnum,
  appShape: AppShapeEnum,
  repositoryStructure: RepositoryStructureEnum.default('monorepo-isolated'),
  architecture: ArchitectureEnum.default('layered'),
  database: DatabaseEnum.default('none'),
  databaseConfig: DatabaseConfigSchema.optional(),
  orm: OrmEnum.default('none'),
  migrationTool: MigrationToolEnum.default('native'),
  messageQueue: MessageQueueEnum.default('none'),
  authScheme: AuthSchemeEnum.default('none'),
  extras: z.array(ExtraEnum).default([]),
  runtimeVersion: z.string().optional(),
  frontend: SubStackSchema.optional(),
  backend: SubStackSchema.optional(),
  services: z.array(ServiceDefinitionSchema).optional(),
  gateway: GatewayDefinitionSchema.optional(),
});

export type Answer = z.infer<typeof AnswerSchema>;
export type AnswerInput = z.input<typeof AnswerSchema>;
