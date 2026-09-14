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

export const ArchitectureEnum = z.enum([
  'layered',
  'clean',
  'feature-first',
  'modular-monolith',
  'none',
]);
export type Architecture = z.infer<typeof ArchitectureEnum>;

export const DatabaseEnum = z.enum(['postgres', 'mysql', 'mongodb', 'sqlite', 'none']);
export type Database = z.infer<typeof DatabaseEnum>;

export const OrmEnum = z.enum([
  'prisma',
  'sqlalchemy',
  'flyway',
  'efcore',
  'mongoose',
  'motor',
  'pymongo',
  'drift',
  'none',
]);
export type Orm = z.infer<typeof OrmEnum>;

export const ExtraEnum = z.enum(['auth', 'docker', 'ci', 'lint', 'testing', 'env', 'git']);
export type Extra = z.infer<typeof ExtraEnum>;

export const SubStackSchema = z.object({
  stack: StackEnum,
  framework: FrameworkEnum,
});
export type SubStack = z.infer<typeof SubStackSchema>;

export const ServiceDefinitionSchema = z.object({
  name: z
    .string()
    .min(1, 'Service name is required')
    .regex(/^[a-zA-Z0-9~_-]+$/, 'Service name must be alphanumeric with hyphens or underscores'),
  stack: StackEnum,
  framework: FrameworkEnum,
  port: z.number().int().positive(),
  database: DatabaseEnum.default('none'),
  orm: OrmEnum.default('none'),
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
  architecture: ArchitectureEnum,
  database: DatabaseEnum,
  orm: OrmEnum,
  extras: z.array(ExtraEnum).default([]),
  runtimeVersion: z.string().optional(),
  frontend: SubStackSchema.optional(),
  backend: SubStackSchema.optional(),
  services: z.array(ServiceDefinitionSchema).optional(),
  gateway: GatewayDefinitionSchema.optional(),
});

export type Answer = z.infer<typeof AnswerSchema>;
