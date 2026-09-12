import { z } from 'zod';
import { AppShapeEnum, DatabaseEnum, FrameworkEnum, StackEnum } from './answer.js';

export const PlaceholderSchema = z.union([
  z.string().min(1),
  z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    files: z.array(z.string()).optional(),
  }),
]);
export type Placeholder = z.infer<typeof PlaceholderSchema>;

export const TemplateManifestSchema = z.object({
  id: z.string().min(1, 'Template id is required'),
  name: z.string().optional(),
  description: z.string().optional(),
  stack: StackEnum,
  framework: FrameworkEnum,
  compatibleShapes: z
    .array(AppShapeEnum)
    .min(1, 'At least one compatible app shape must be specified'),
  compatibleDatabases: z.array(DatabaseEnum).default([]),
  minRuntimeVersion: z.string().min(1, 'Minimum runtime version is required'),
  placeholders: z.array(PlaceholderSchema).default([]),
  fragments: z.array(z.string()).default([]),
});

export type TemplateManifest = z.infer<typeof TemplateManifestSchema>;
