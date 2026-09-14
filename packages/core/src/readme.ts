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

  if (answer.appShape === 'microservices') {
    return [
      {
        label: 'Start All Microservices with Docker Compose',
        commands: ['docker compose up --build'],
      },
      {
        label: 'Start API Gateway locally',
        commands: ['cd gateway', 'npm install', 'npm run dev'],
      },
      {
        label: 'Start Downstream Services',
        commands: [
          '# Run each service in its directory (e.g. services/auth-service)',
          'cd services/auth-service && npm install && npm run dev',
        ],
      },
    ];
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
    `> Scaffolded with [**scafx**](https://github.com/scafx/scafx).`,
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

  if (answer.appShape === 'microservices') {
    const gatewayPort = answer.gateway?.port ?? 8000;
    const services =
      answer.services && answer.services.length > 0
        ? answer.services
        : [
            { name: 'auth-service', stack: 'node', framework: 'express', port: 8001 },
            { name: 'catalog-service', stack: 'python', framework: 'fastapi', port: 8002 },
          ];

    sections.push('\n### Microservices Architecture');
    sections.push(
      `- **API Gateway**: Port \`${gatewayPort}\` in \`/gateway\` (Unified entrypoint, reverse proxy routing, CORS)`,
    );
    services.forEach((svc) => {
      sections.push(
        `- **${svc.name}**: \`${svc.stack}\` (\`${svc.framework}\`) on port \`${svc.port}\` located in \`/services/${svc.name}\``,
      );
    });
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
    } else if (answer.orm === 'mongoose') {
      sections.push('This project uses **Mongoose** for MongoDB object modeling and validation.');
      sections.push('```bash');
      sections.push('# Start MongoDB using Docker Compose');
      sections.push('docker compose up -d mongo');
      sections.push('```');
    } else if (answer.orm === 'motor' || answer.orm === 'pymongo') {
      sections.push('This project uses **Motor** for asynchronous MongoDB access.');
      sections.push('```bash');
      sections.push('# Start MongoDB using Docker Compose');
      sections.push('docker compose up -d mongo');
      sections.push('```');
    }
  }

  // Authentication Section
  if (answer.extras.includes('auth')) {
    sections.push('\n## Authentication');
    sections.push(
      'This project includes **JWT (JSON Web Token)** authentication with password hashing and protected endpoints:',
    );
    sections.push('- `POST /api/auth/register` — Create a new user account');
    sections.push('- `POST /api/auth/login` — Authenticate and receive a JWT Bearer token');
    sections.push(
      '- `GET /api/auth/me` — Retrieve current user profile (requires `Authorization: Bearer <token>`)',
    );
  }

  // Environment Configuration
  sections.push('\n## Environment Configuration');
  sections.push('Copy the template environment configuration file and adjust variables as needed:');
  sections.push('```bash');
  if (answer.appShape === 'fullstack') {
    sections.push('cp .env.example .env');
    sections.push('cp frontend/.env.example frontend/.env');
    sections.push('cp backend/.env.example backend/.env');
  } else if (answer.appShape === 'microservices') {
    sections.push('cp .env.example .env');
    sections.push('cp gateway/.env.example gateway/.env');
    const services =
      answer.services && answer.services.length > 0
        ? answer.services
        : [{ name: 'auth-service' }, { name: 'catalog-service' }];
    services.forEach((s) => {
      sections.push(`cp services/${s.name}/.env.example services/${s.name}/.env`);
    });
  } else {
    sections.push('cp .env.example .env');
  }
  sections.push('```');

  return sections.join('\n') + '\n';
}
