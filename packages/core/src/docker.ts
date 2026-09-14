import type { Answer, Stack } from './schema/answer.js';
import type { FileOp } from './types/file-op.js';

export function getStandaloneDockerfile(
  stack: Stack,
  framework: string,
  projectName: string,
): string {
  if (stack === 'node') {
    const entrypoint = framework === 'nestjs' ? 'dist/main.js' : 'dist/index.js';
    return `# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production Stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "${entrypoint}"]
`;
  }

  if (stack === 'python') {
    const startCmd =
      framework === 'fastapi'
        ? 'CMD ["uvicorn", "src.app.main:app", "--host", "0.0.0.0", "--port", "8000"]'
        : framework === 'flask'
          ? 'CMD ["python", "src/app/main.py"]'
          : 'CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]';
    return `FROM python:3.11-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1
COPY requirements*.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
${startCmd}
`;
  }

  if (stack === 'dotnet') {
    return `# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY *.csproj ./
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "${projectName}.dll"]
`;
  }

  if (stack === 'react') {
    if (framework === 'nextjs') {
      return `# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "start"]
`;
    }
    return `# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Nginx Web Server Stage
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;
  }

  if (stack === 'flutter') {
    return `FROM ghcr.io/cirruslabs/flutter:stable
WORKDIR /app
COPY . .
RUN flutter pub get
RUN flutter test
`;
  }

  return `# Generic Dockerfile
FROM alpine:latest
WORKDIR /app
COPY . .
`;
}

export function getStandaloneDockerCompose(answer: Answer): string {
  const port =
    answer.stack === 'python'
      ? '8000:8000'
      : answer.stack === 'dotnet'
        ? '5000:5000'
        : answer.stack === 'react' && answer.framework !== 'nextjs'
          ? '80:80'
          : '3000:3000';

  return `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: '${answer.projectName}-app'
    restart: unless-stopped
    ports:
      - '${port}'
    env_file:
      - .env
`;
}

export function getFullstackDockerCompose(answer: Answer): string {
  return `version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: '${answer.projectName}-backend'
    restart: unless-stopped
    ports:
      - '8000:8000'
    env_file:
      - backend/.env

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: '${answer.projectName}-frontend'
    restart: unless-stopped
    ports:
      - '3000:3000'
    env_file:
      - frontend/.env
    depends_on:
      - backend
`;
}

export const DOCKERIGNORE_CONTENT = `node_modules
dist
build
.git
.gitignore
.env
.env.local
.venv
__pycache__
*.pyc
bin/
obj/
.dart_tool/
.next/
out/
coverage/
`;

export function generateProjectDocker(answer: Answer): FileOp[] {
  const ops: FileOp[] = [];

  if (answer.appShape === 'fullstack') {
    const frontendStack = answer.frontend?.stack ?? (answer.stack === 'react' ? 'react' : 'react');
    const frontendFramework =
      answer.frontend?.framework ?? (answer.stack === 'react' ? answer.framework : 'vite');
    const backendStack =
      answer.backend?.stack ?? (answer.stack !== 'react' ? answer.stack : 'python');
    const backendFramework =
      answer.backend?.framework ?? (answer.stack !== 'react' ? answer.framework : 'fastapi');

    ops.push({
      path: 'frontend/Dockerfile',
      content: getStandaloneDockerfile(
        frontendStack,
        frontendFramework,
        `${answer.projectName}-frontend`,
      ),
    });
    ops.push({
      path: 'frontend/.dockerignore',
      content: DOCKERIGNORE_CONTENT,
    });

    ops.push({
      path: 'backend/Dockerfile',
      content: getStandaloneDockerfile(
        backendStack,
        backendFramework,
        `${answer.projectName}-backend`,
      ),
    });
    ops.push({
      path: 'backend/.dockerignore',
      content: DOCKERIGNORE_CONTENT,
    });

    ops.push({
      path: 'docker-compose.yml',
      content: getFullstackDockerCompose(answer),
    });
    ops.push({
      path: '.dockerignore',
      content: DOCKERIGNORE_CONTENT,
    });
  } else {
    ops.push({
      path: 'Dockerfile',
      content: getStandaloneDockerfile(answer.stack, answer.framework, answer.projectName),
    });
    ops.push({
      path: 'docker-compose.yml',
      content: getStandaloneDockerCompose(answer),
    });
    ops.push({
      path: '.dockerignore',
      content: DOCKERIGNORE_CONTENT,
    });
  }

  return ops;
}
