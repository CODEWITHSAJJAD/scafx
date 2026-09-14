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
  type GatewayDefinition,
  type Orm,
  type ServiceDefinition,
  type Stack,
} from '@scafx/core';
import {
  DotnetChecker,
  FlutterChecker,
  NodeChecker,
  PythonChecker,
  resolveRequiredCheckers,
  runPreflightChecks,
  type Checker,
} from '@scafx/preflight';
import { FsTemplateSource } from '@scafx/templates';
import fs from 'node:fs/promises';
import path from 'node:path';
import pc from 'picocolors';
import { initGitRepository } from '../git.js';
import { promptInteractive } from '../prompts/interactive.js';

export function parseServicesSpec(
  servicesFlag?: string,
  servicesConfig?: unknown,
): ServiceDefinition[] {
  if (Array.isArray(servicesConfig) && servicesConfig.length > 0) {
    return servicesConfig as ServiceDefinition[];
  }

  if (servicesFlag) {
    const parts = servicesFlag
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    return parts.map((part, idx) => {
      const [name, stack, framework, portStr, database, orm, extrasStr] = part.split(':');
      return {
        name: name || `service-${idx + 1}`,
        stack: (stack as Stack) || 'node',
        framework: (framework as Framework) || 'express',
        port: portStr ? parseInt(portStr, 10) : 8001 + idx,
        database: (database as Database) || 'none',
        orm: (orm as Orm) || 'none',
        extras: extrasStr ? (extrasStr.split('+') as Extra[]) : [],
      };
    });
  }

  // Default reference microservices if none specified
  return [
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
}

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
  'gateway-stack'?: string;
  'gateway-framework'?: string;
  'gateway-port'?: number;
  services?: string;
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

  const appShape =
    ((flags.shape ?? fileConfig.appShape ?? fileConfig.shape) as AppShape) || 'standalone';

  const rawAnswer = {
    projectName: flags.name ?? fileConfig.projectName ?? fileConfig.name,
    stack: ((flags.stack ?? fileConfig.stack) as Stack) || 'node',
    framework: ((flags.framework ?? fileConfig.framework) as Framework) || 'express',
    appShape,
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
    gateway:
      appShape === 'microservices'
        ? {
            stack: (flags['gateway-stack'] ??
              (fileConfig.gateway as GatewayDefinition | undefined)?.stack ??
              'node') as Stack,
            framework: (flags['gateway-framework'] ??
              (fileConfig.gateway as GatewayDefinition | undefined)?.framework ??
              'express') as Framework,
            port:
              flags['gateway-port'] ??
              (fileConfig.gateway as GatewayDefinition | undefined)?.port ??
              8000,
          }
        : undefined,
    services:
      appShape === 'microservices'
        ? parseServicesSpec(flags.services, fileConfig.services)
        : undefined,
  };

  return AnswerSchema.parse(rawAnswer);
}

export default class New extends Command {
  static override description = 'Scaffold a new project';

  // Test hook for injected checkers
  public static customCheckers?: Checker[];

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
    'skip-preflight': Flags.boolean({
      description: 'Skip runtime environment preflight checks',
      default: false,
    }),
    force: Flags.boolean({
      description: 'Bypass preflight check failures and proceed',
      default: false,
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
    'gateway-stack': Flags.string({
      description: 'API Gateway stack for microservices (node)',
    }),
    'gateway-framework': Flags.string({
      description: 'API Gateway framework for microservices (express)',
    }),
    'gateway-port': Flags.integer({
      description: 'API Gateway port for microservices (default: 8000)',
    }),
    services: Flags.string({
      description:
        'Microservices list spec (e.g. auth-service:node:express:8001:postgres:prisma:auth,catalog-service:python:fastapi:8002:mongodb:motor)',
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
    const isMicroservices = flags.shape === 'microservices';
    const isInteractive =
      !flags['non-interactive'] &&
      !flags.config &&
      (!flags.name || (!isMicroservices && (!flags.stack || !flags.framework)));

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

    // Preflight checks (guided-manual tier)
    if (!flags['skip-preflight']) {
      const checkers = New.customCheckers ?? resolveRequiredCheckers(answer);
      if (checkers.length > 0) {
        const preflightReport = await runPreflightChecks(checkers);
        if (!preflightReport.allPassed) {
          if (!flags.silent) {
            const failureNotes = preflightReport.failures
              .map((f) => {
                const status = f.found
                  ? `Found version ${pc.yellow(f.version)}, but ${pc.cyan(`>= ${f.minVersionRequired}`)} is required.`
                  : pc.red('Runtime not detected in PATH.');
                return `${pc.bold(f.name)}: ${status}\n${pc.dim('Manual Installation:')}\n${f.manualInstructions}`;
              })
              .join('\n\n');

            p.note(failureNotes, 'Runtime Environment Warning');
          }

          if (!flags.force) {
            if (isInteractive) {
              const proceed = await p.confirm({
                message: 'Required runtimes are missing or outdated. Continue anyway?',
                initialValue: false,
              });
              if (p.isCancel(proceed) || !proceed) {
                p.cancel('Scaffolding aborted due to unsatisfied preflight requirements.');
                this.error('Preflight check failed: runtime requirements not met.', { exit: 1 });
              }
            } else {
              this.error(
                'Preflight check failed: runtime requirements not met. Use --skip-preflight or --force to bypass.',
                { exit: 1 },
              );
            }
          }
        }
      }
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
