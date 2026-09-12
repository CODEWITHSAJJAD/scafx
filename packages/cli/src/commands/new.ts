import * as p from '@clack/prompts';
import { Command, Flags } from '@oclif/core';
import {
  AnswerSchema,
  DiskFileWriter,
  generate,
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
import path from 'node:path';
import pc from 'picocolors';
import { promptInteractive } from '../prompts/interactive.js';

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
    out: Flags.string({ char: 'o', description: 'Output destination directory' }),
  };

  public async run(): Promise<Answer> {
    const { flags } = await this.parse(New);

    let answer: Answer;

    // Check if enough flags are passed for non-interactive / partially non-interactive
    const isInteractive = !flags.name || !flags.stack || !flags.framework;

    if (isInteractive) {
      answer = await promptInteractive({
        projectName: flags.name,
        stack: flags.stack as Stack,
        framework: flags.framework as Framework,
        appShape: flags.shape as AppShape,
        architecture: flags.arch as Architecture,
        database: flags.db as Database,
        orm: flags.orm as Orm,
        extras: flags.extras ? (flags.extras.split(',') as Extra[]) : undefined,
      });
    } else {
      const rawAnswer = {
        projectName: flags.name,
        stack: flags.stack as Stack,
        framework: flags.framework as Framework,
        appShape: (flags.shape as AppShape) || 'standalone',
        architecture: (flags.arch as Architecture) || 'layered',
        database: (flags.db as Database) || 'none',
        orm: (flags.orm as Orm) || 'none',
        extras: flags.extras ? (flags.extras.split(',') as Extra[]) : [],
      };
      answer = AnswerSchema.parse(rawAnswer);
    }

    const spinner = p.spinner();
    spinner.start(
      `Scaffolding ${pc.cyan(answer.projectName)} (${answer.stack} + ${answer.framework})...`,
    );

    try {
      const templateSource = new FsTemplateSource();
      const fileOps = await generate(answer, templateSource);

      const targetDir = flags.out
        ? path.resolve(flags.out)
        : path.resolve(process.cwd(), answer.projectName);

      const fileWriter = new DiskFileWriter({ overwrite: false });
      await fileWriter.write(targetDir, fileOps);

      spinner.stop(`Successfully scaffolded ${pc.green(answer.projectName)}!`);

      p.note(
        [
          pc.bold('Next steps:'),
          `  1. ${pc.cyan(`cd ${answer.projectName}`)}`,
          `  2. ${pc.cyan('npm install')}`,
          `  3. ${pc.cyan('npm run dev')}`,
        ].join('\n'),
        'Get Started',
      );

      return answer;
    } catch (err: unknown) {
      spinner.stop(pc.red('Scaffolding failed.'));
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.error(errorMsg);
    }
  }
}
