import * as p from '@clack/prompts';
import { Command, Flags } from '@oclif/core';
import {
  AnswerSchema,
  DiskFileWriter,
  generate,
  getNextCommands,
  type Answer,
  type AppShape,
  type Architecture,
  type Database,
  type Extra,
  type Framework,
  type Orm,
  type Stack,
} from '@project-scaffolder/core';
import { FsTemplateSource } from '@project-scaffolder/templates';
import fs from 'node:fs/promises';
import path from 'node:path';
import pc from 'picocolors';
import { initGitRepository } from '../git.js';
import { promptInteractive } from '../prompts/interactive.js';

export async function parseAnswerFromFlagsOrConfig(flags: {
  name?: string;
  stack?: string;
  framework?: string;
  shape?: string;
  arch?: string;
  db?: string;
  orm?: string;
  extras?: string;
  git?: boolean;
  'frontend-stack'?: string;
  'frontend-framework'?: string;
  'backend-stack'?: string;
  'backend-framework'?: string;
  config?: string;
}): Promise<Answer> {
  let fileConfig: Partial<Record<string, unknown>> = {};

  if (flags.config) {
    const configPath = path.resolve(flags.config);
    const rawConfig = await fs.readFile(configPath, 'utf-8');
    fileConfig = JSON.parse(rawConfig);
  }

  let extras: Extra[] = flags.extras
    ? (flags.extras.split(',').map((e) => e.trim()) as Extra[])
    : Array.isArray(fileConfig.extras)
      ? (fileConfig.extras as Extra[])
      : [];

  if (flags.git === true && !extras.includes('git')) {
    extras.push('git');
  } else if (flags.git === false) {
    extras = extras.filter((e) => e !== 'git');
  }

  const rawAnswer = {
    projectName: flags.name ?? fileConfig.projectName ?? fileConfig.name,
    stack: (flags.stack ?? fileConfig.stack) as Stack,
    framework: (flags.framework ?? fileConfig.framework) as Framework,
    appShape:
      ((flags.shape ?? fileConfig.appShape ?? fileConfig.shape) as AppShape) || 'standalone',
    architecture:
      ((flags.arch ?? fileConfig.architecture ?? fileConfig.arch) as Architecture) || 'layered',
    database: ((flags.db ?? fileConfig.database ?? fileConfig.db) as Database) || 'none',
    orm: ((flags.orm ?? fileConfig.orm) as Orm) || 'none',
    extras,
    runtimeVersion:
      typeof fileConfig.runtimeVersion === 'string' ? fileConfig.runtimeVersion : undefined,
    frontend:
      flags['frontend-stack'] && flags['frontend-framework']
        ? {
            stack: flags['frontend-stack'] as Stack,
            framework: flags['frontend-framework'] as Framework,
          }
        : (fileConfig.frontend as { stack: Stack; framework: Framework } | undefined),
    backend:
      flags['backend-stack'] && flags['backend-framework']
        ? {
            stack: flags['backend-stack'] as Stack,
            framework: flags['backend-framework'] as Framework,
          }
        : (fileConfig.backend as { stack: Stack; framework: Framework } | undefined),
  };

  return AnswerSchema.parse(rawAnswer);
}

export default class New extends Command {
  static override description = 'Scaffold a new project';

  static override flags = {
    name: Flags.string({ char: 'n', description: 'Project name' }),
    stack: Flags.string({
      char: 's',
      description: 'Stack / ecosystem (node, python, dotnet, react, flutter)',
    }),
    framework: Flags.string({
      char: 'f',
      description: 'Framework (express, fastify, nestjs, fastapi, etc.)',
    }),
    shape: Flags.string({
      description: 'App shape (standalone, frontend-backend, fullstack, microservices)',
    }),
    arch: Flags.string({ description: 'Architecture style (layered, clean, feature-first, etc.)' }),
    db: Flags.string({
      char: 'd',
      description: 'Database (postgres, mysql, sqlite, mongodb, none)',
    }),
    orm: Flags.string({
      description: 'ORM / migration tool (prisma, sqlalchemy, efcore, none, etc.)',
    }),
    extras: Flags.string({
      description: 'Comma-separated extras (docker,ci,lint,testing,env,git)',
    }),
    git: Flags.boolean({
      description: 'Initialize git repository and make initial commit',
      allowNo: true,
    }),
    'frontend-stack': Flags.string({
      description: 'Frontend stack for full-stack project (react)',
    }),
    'frontend-framework': Flags.string({
      description: 'Frontend framework for full-stack project (vite, nextjs)',
    }),
    'backend-stack': Flags.string({
      description: 'Backend stack for full-stack project (python, node, dotnet)',
    }),
    'backend-framework': Flags.string({
      description: 'Backend framework for full-stack project (fastapi, express, webapi)',
    }),
    config: Flags.string({ char: 'c', description: 'Path to JSON config file containing answers' }),
    'non-interactive': Flags.boolean({
      description: 'Disable interactive prompts and use flag/config defaults',
    }),
    out: Flags.string({ char: 'o', description: 'Output destination directory' }),
    silent: Flags.boolean({ description: 'Suppress console output and spinners', default: false }),
  };

  public async run(): Promise<Answer> {
    const { flags } = await this.parse(New);

    let answer: Answer;

    // Check if interactive mode is requested
    const isInteractive =
      !flags['non-interactive'] &&
      !flags.config &&
      (!flags.name || !flags.stack || !flags.framework);

    if (isInteractive) {
      answer = await promptInteractive({
        projectName: flags.name,
        stack: flags.stack as Stack,
        framework: flags.framework as Framework,
        appShape: flags.shape as AppShape,
        architecture: flags.arch as Architecture,
        database: flags.db as Database,
        orm: flags.orm as Orm,
        extras: flags.extras
          ? (flags.extras.split(',').map((e) => e.trim()) as Extra[])
          : undefined,
      });
    } else {
      answer = await parseAnswerFromFlagsOrConfig(flags);
    }

    const spinner = flags.silent ? null : p.spinner();
    if (spinner) {
      spinner.start(
        `Scaffolding ${pc.cyan(answer.projectName)} (${answer.stack} + ${answer.framework})...`,
      );
    }

    try {
      const templateSource = new FsTemplateSource();
      const fileOps = await generate(answer, templateSource);

      const targetDir = flags.out
        ? path.resolve(flags.out)
        : path.resolve(process.cwd(), answer.projectName);

      const fileWriter = new DiskFileWriter({ overwrite: false });
      await fileWriter.write(targetDir, fileOps);

      // Post-generation git initialization if requested
      if (answer.extras.includes('git')) {
        const gitResult = await initGitRepository(targetDir);
        if (!gitResult.success && !flags.silent) {
          this.warn(`Failed to initialize git repository: ${gitResult.error}`);
        }
      }

      if (spinner) {
        spinner.stop(`Successfully scaffolded ${pc.green(answer.projectName)}!`);

        const nextSteps = getNextCommands(answer);
        const stepLines: string[] = [pc.bold('Next steps:')];
        let counter = 1;
        for (const step of nextSteps) {
          for (const cmd of step.commands) {
            if (!cmd.startsWith('#')) {
              stepLines.push(`  ${counter++}. ${pc.cyan(cmd)}`);
            }
          }
        }

        p.note(stepLines.join('\n'), 'Get Started');
      }

      return answer;
    } catch (err: unknown) {
      if (spinner) {
        spinner.stop(pc.red('Scaffolding failed.'));
      }
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.error(errorMsg);
    }
  }
}
