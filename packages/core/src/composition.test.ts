import { describe, expect, it } from 'vitest';
import { generate } from './generate.js';
import type { TemplateSource, Template } from './ports/template-source.js';
import type { Answer } from './schema/answer.js';

describe('App-shape composition logic in core', () => {
  const mockFrontendTemplate: Template = {
    manifest: {
      id: 'react-vite-standalone',
      stack: 'react',
      framework: 'vite',
      compatibleShapes: ['standalone', 'fullstack'],
      compatibleDatabases: ['none', 'postgres'],
      minRuntimeVersion: '>=18.0.0',
      placeholders: ['projectName'],
      fragments: [],
    },
    files: [
      { path: 'package.json', content: '{"name": "{{projectName}}-frontend"}' },
      {
        path: 'src/App.tsx',
        content: 'export function App() { return <h1>{{projectName}}</h1>; }',
      },
      { path: '.env.example', content: 'VITE_APP_TITLE={{projectName}}\n' },
    ],
  };

  const mockBackendTemplate: Template = {
    manifest: {
      id: 'python-fastapi-standalone',
      stack: 'python',
      framework: 'fastapi',
      compatibleShapes: ['standalone', 'fullstack'],
      compatibleDatabases: ['postgres', 'none'],
      minRuntimeVersion: '>=3.11.0',
      placeholders: ['projectName'],
      fragments: [],
    },
    files: [
      { path: 'pyproject.toml', content: '[project]\nname = "{{projectName}}-backend"' },
      { path: 'app/main.py', content: '# {{projectName}} FastAPI main' },
      { path: '.env.example', content: 'SECRET_KEY=change-me\n' },
    ],
  };

  const mockCorsFragment: Template = {
    manifest: {
      id: 'cors-api-wiring',
      stack: 'node',
      framework: 'express',
      compatibleShapes: ['fullstack'],
      compatibleDatabases: ['none'],
      minRuntimeVersion: '>=18.0.0',
      placeholders: ['apiUrl'],
      fragments: [],
    },
    files: [
      {
        path: '.env.example',
        content: 'PORT={{backendPort}}\nFRONTEND_PORT={{frontendPort}}\nVITE_API_URL={{apiUrl}}\n',
      },
      { path: 'frontend/.env.example', content: 'VITE_API_BASE_URL={{apiUrl}}\n' },
      { path: 'backend/.env.example', content: 'CORS_ORIGIN=http://localhost:{{frontendPort}}\n' },
    ],
  };

  const templateSource: TemplateSource = {
    getTemplate: (answer: Answer) => {
      if (answer.stack === 'react' && answer.framework === 'vite') {
        return mockFrontendTemplate;
      }
      if (answer.stack === 'python' && answer.framework === 'fastapi') {
        return mockBackendTemplate;
      }
      throw new Error(`Unexpected template requested: ${answer.stack}-${answer.framework}`);
    },
    getFragment: (fragmentId: string) => {
      if (fragmentId === 'cors-api-wiring') {
        return mockCorsFragment;
      }
      return null;
    },
  };

  it('composes frontend and backend templates into full-stack directory structure with CORS & API URL wiring', async () => {
    const answer: Answer = {
      projectName: 'my-fullstack-app',
      stack: 'react',
      framework: 'vite',
      appShape: 'fullstack',
      architecture: 'modular-monolith',
      database: 'postgres',
      orm: 'sqlalchemy',
      frontend: {
        stack: 'react',
        framework: 'vite',
      },
      backend: {
        stack: 'python',
        framework: 'fastapi',
      },
      extras: ['git'],
    };

    const fileOps = await generate(answer, templateSource);

    // Verify frontend files are placed under frontend/
    const frontendPkg = fileOps.find((op) => op.path === 'frontend/package.json');
    expect(frontendPkg).toBeDefined();
    expect(frontendPkg!.content).toContain('"my-fullstack-app-frontend"');

    const frontendApp = fileOps.find((op) => op.path === 'frontend/src/App.tsx');
    expect(frontendApp).toBeDefined();
    expect(frontendApp!.content).toContain('<h1>my-fullstack-app</h1>');

    // Verify backend files are placed under backend/
    const backendPyproject = fileOps.find((op) => op.path === 'backend/pyproject.toml');
    expect(backendPyproject).toBeDefined();
    expect(backendPyproject!.content).toContain('name = "my-fullstack-app-backend"');

    const backendMain = fileOps.find((op) => op.path === 'backend/app/main.py');
    expect(backendMain).toBeDefined();

    // Verify root README.md exists
    const rootReadme = fileOps.find((op) => op.path === 'README.md');
    expect(rootReadme).toBeDefined();
    expect(rootReadme!.content).toContain('# my-fullstack-app');

    // Verify root .env.example with wiring
    const rootEnv = fileOps.find((op) => op.path === '.env.example');
    expect(rootEnv).toBeDefined();
    expect(rootEnv!.content).toContain('VITE_API_URL=http://localhost:8000');
    expect(rootEnv!.content).toContain('PORT=8000');

    // Verify frontend/.env.example has merged wiring
    const frontendEnv = fileOps.find((op) => op.path === 'frontend/.env.example');
    expect(frontendEnv).toBeDefined();
    expect(frontendEnv!.content).toContain('VITE_API_BASE_URL=http://localhost:8000');
    expect(frontendEnv!.content).toContain('VITE_APP_TITLE=my-fullstack-app');

    // Verify backend/.env.example has merged wiring
    const backendEnv = fileOps.find((op) => op.path === 'backend/.env.example');
    expect(backendEnv).toBeDefined();
    expect(backendEnv!.content).toContain('SECRET_KEY=change-me');
    expect(backendEnv!.content).toContain('CORS_ORIGIN=http://localhost:3000');
  });
});
