import { DotnetChecker } from './checkers/dotnet.js';
import { NodeChecker } from './checkers/node.js';
import { PythonChecker } from './checkers/python.js';
import type { Checker } from './types.js';

export interface AnswerLike {
  stack: string;
  framework: string;
  appShape?: string;
  frontend?: { stack: string; framework: string };
  backend?: { stack: string; framework: string };
}

export function resolveRequiredCheckers(answer: AnswerLike): Checker[] {
  const checkers: Checker[] = [];
  const neededStacks = new Set<string>();

  if (answer.appShape === 'fullstack') {
    if (answer.frontend?.stack) neededStacks.add(answer.frontend.stack);
    if (answer.backend?.stack) neededStacks.add(answer.backend.stack);
    if (answer.stack) neededStacks.add(answer.stack);
  } else {
    neededStacks.add(answer.stack);
  }

  if (neededStacks.has('node') || neededStacks.has('react')) {
    checkers.push(new NodeChecker());
  }

  if (neededStacks.has('python')) {
    checkers.push(new PythonChecker());
  }

  if (neededStacks.has('dotnet')) {
    checkers.push(new DotnetChecker());
  }

  return checkers;
}
