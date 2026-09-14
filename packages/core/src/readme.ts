import type { Answer } from './schema/answer.js';

export function getNextCommands(answer: Answer): { label: string; commands: string[] }[] {
  if (answer.appShape === 'fullstack') {
    const frontendStack = answer.frontend?.stack ?? (answer.stack === 'react' ? 'react' : 'react');
    const backendStack =
      answer.backend?.stack ?? (answer.stack !== 'react' ? answer.stack : 'python');
    const backendFramework =
      answer.backend?.framework ?? (answer.stack !== 'react' ? answer.framework : 'fastapi');

    const result: { label: string; commands: string[] }[] = [];

    // 1. Database / Docker if present
    if (answer.extras.includes('docker') || answer.database !== 'none') {
      result.push({
        label: 'Start Database Services (Docker)',
        commands: ['docker compose up -d'],
      });
    }

    // 2. Backend
    if (backendStack === 'python') {
      result.push({
        label: 'Start Backend Service (FastAPI)',
        commands: [
          'cd backend',
          'python -m venv .venv',
          '# Windows: .venv\\Scripts\\activate | Unix: source .venv/bin/activate',
          'pip install -r requirements.txt',
          backendFramework === 'fastapi'
            ? 'uvicorn src.app.main:app --reload'
            : 'python src/app/main.py',
        ],
      });
    } else {
      result.push({
        label: 'Start Backend Service (Node)',
        commands: ['cd backend', 'npm install', 'npm run dev'],
      });
    }

    // 3. Frontend
    result.push({
      label: `Start Frontend (${frontendStack})`,
      commands: ['cd frontend', 'npm install', 'npm run dev'],
    });

    return result;
  }

  // Standalone Next Steps
  if (answer.stack === 'python') {
    return [
      {
        label: 'Create virtual environment & install dependencies',
        commands: [
          `cd ${answer.projectName}`,
          'python -m venv .venv',
          '# Windows: .venv\\Scripts\\activate | Unix: source .venv/bin/activate',
          'pip install -r requirements.txt',
        ],
      },
      {
        label: 'Start Development Server',
        commands: [
          answer.framework === 'fastapi'
            ? 'uvicorn src.app.main:app --reload'
            : 'python src/app/main.py',
        ],
      },
    ];
  }

  if (answer.stack === 'dotnet') {
    return [
      {
        label: 'Restore and Build Project',
        commands: [`cd ${answer.projectName}`, 'dotnet restore', 'dotnet build'],
      },
      {
        label: 'Run Development Server',
        commands: ['dotnet run'],
      },
      {
        label: 'Publish for Production',
        commands: ['dotnet publish -c Release'],
      },
    ];
  }

  if (answer.stack === 'flutter') {
    return [
      {
        label: 'Get Dependencies',
        commands: [`cd ${answer.projectName}`, 'flutter pub get'],
      },
      {
        label: 'Run Application',
        commands: ['flutter run'],
      },
      {
        label: 'Run Tests',
        commands: ['flutter test'],
      },
    ];
  }

  if (answer.stack === 'node' || answer.stack === 'react') {
    const installCommands = [`cd ${answer.projectName}`, 'npm install'];
    if (answer.stack === 'node' && answer.orm === 'prisma') {
      installCommands.push('npx prisma generate', 'npm run db:push');
    }
    return [
      {
        label: 'Install Dependencies',
        commands: installCommands,
      },
      {
        label: 'Start Development Server',
        commands: ['npm run dev'],
      },
      {
        label: 'Build for Production',
        commands: ['npm run build'],
      },
    ];
  }

  // Default fallback
  return [
    {
      label: 'Get Started',
      commands: [`cd ${answer.projectName}`, 'npm install', 'npm start'],
    },
  ];
}

/**
 * Generates a tailored, comprehensive README.md content based on the project's Answer object.
 */
export function generateProjectReadme(answer: Answer): string {
  const sections: string[] = [];

  // Header
  sections.push(`# ${answer.projectName}`);
  sections.push(
    `> Scaffolded with [**Universal Project Scaffolder**](https://github.com/project-scaffolder).`,
  );

  // Architecture & Stack Summary
  sections.push('## Project Overview');
  sections.push('| Property | Selection |');
  sections.push('|---|---|');
  sections.push(`| **Stack / Ecosystem** | \`${answer.stack}\` |`);
  sections.push(`| **Framework** | \`${answer.framework}\` |`);
  sections.push(`| **App Shape** | \`${answer.appShape}\` |`);
  sections.push(`| **Architecture Style** | \`${answer.architecture}\` |`);
  sections.push(`| **Database** | \`${answer.database}\` |`);
  sections.push(`| **ORM / Migrations** | \`${answer.orm}\` |`);
  if (answer.extras.length > 0) {
    sections.push(`| **Included Extras** | ${answer.extras.map((e) => `\`${e}\``).join(', ')} |`);
  }

  if (answer.appShape === 'fullstack') {
    const frontendStack = answer.frontend?.stack ?? (answer.stack === 'react' ? 'react' : 'react');
    const frontendFramework =
      answer.frontend?.framework ?? (answer.stack === 'react' ? answer.framework : 'vite');
    const backendStack =
      answer.backend?.stack ?? (answer.stack !== 'react' ? answer.stack : 'python');
    const backendFramework =
      answer.backend?.framework ?? (answer.stack !== 'react' ? answer.framework : 'fastapi');

    sections.push('\n### Full-Stack Architecture');
    sections.push(
      `- **Frontend SPA**: \`${frontendStack}\` (\`${frontendFramework}\`) located in \`/frontend\``,
    );
    sections.push(
      `- **Backend API**: \`${backendStack}\` (\`${backendFramework}\`) located in \`/backend\``,
    );
    sections.push('- **Cross-Wiring**: API Base URL and CORS pre-configured in `.env.example`.');
  }

  // Next Steps / Quick Start
  sections.push('\n## Getting Started');
  const nextSteps = getNextCommands(answer);

  nextSteps.forEach((step, idx) => {
    sections.push(`### Step ${idx + 1}: ${step.label}`);
    sections.push('```bash');
    step.commands.forEach((cmd) => sections.push(cmd));
    sections.push('```\n');
  });

  // Database & Migrations Section
  if (answer.database !== 'none' && answer.orm !== 'none') {
    sections.push('## Database & Migrations');
    if (answer.orm === 'sqlalchemy') {
      sections.push('This project uses **SQLAlchemy 2.0** with **Alembic** for migrations.');
      sections.push('```bash');
      sections.push('# Apply existing migrations');
      sections.push('alembic upgrade head');
      sections.push('');
      sections.push('# Generate a new migration after editing models');
      sections.push('alembic revision --autogenerate -m "describe_changes"');
      sections.push('```');
    } else if (answer.orm === 'prisma') {
      sections.push('This project uses **Prisma** for type-safe database queries and migrations.');
      sections.push('```bash');
      sections.push('# Generate Prisma client');
      sections.push('npx prisma generate');
      sections.push('');
      sections.push('# Run database migrations');
      sections.push('npx prisma migrate dev');
      sections.push('```');
    } else if (answer.orm === 'efcore') {
      sections.push('This project uses **Entity Framework Core** for data access and migrations.');
      sections.push('```bash');
      sections.push('# Apply database migrations');
      sections.push('dotnet ef database update');
      sections.push('');
      sections.push('# Add a new migration after editing models');
      sections.push('dotnet ef migrations add <MigrationName>');
      sections.push('```');
    }
  }

  // Environment Configuration
  sections.push('\n## Environment Configuration');
  sections.push('Copy the template environment configuration file and adjust variables as needed:');
  sections.push('```bash');
  if (answer.appShape === 'fullstack') {
    sections.push('cp .env.example .env');
    sections.push('cp frontend/.env.example frontend/.env');
    sections.push('cp backend/.env.example backend/.env');
  } else {
    sections.push('cp .env.example .env');
  }
  sections.push('```');

  return sections.join('\n') + '\n';
}
