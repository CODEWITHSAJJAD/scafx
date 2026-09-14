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

export function getMicroservicesDockerCompose(answer: Answer): string {
  const gateway = answer.gateway ?? {
    stack: 'node',
    framework: 'express',
    port: 8000,
  };
  const services = answer.services ?? [];

  const authService = services.find(
    (s) => s.name.includes('auth') || (s.extras && s.extras.includes('auth')),
  );

  const hasPostgres =
    services.some((s) => s.database === 'postgres') || answer.database === 'postgres';
  const hasMongo = services.some((s) => s.database === 'mongodb') || answer.database === 'mongodb';
  const hasMysql = services.some((s) => s.database === 'mysql') || answer.database === 'mysql';

  let compose = `version: '3.8'\n\nservices:\n`;

  // 1. Database containers
  if (hasPostgres) {
    compose += `  postgres:
    image: postgres:16-alpine
    container_name: '${answer.projectName}-postgres'
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: main_db
    ports:
      - '5432:5432'
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - microservices-net\n\n`;
  }

  if (hasMongo) {
    compose += `  mongodb:
    image: mongo:7-jammy
    container_name: '${answer.projectName}-mongodb'
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: password
    ports:
      - '27017:27017'
    volumes:
      - mongo-data:/data/db
    healthcheck:
      test: ['CMD', 'mongosh', '--eval', "db.adminCommand('ping')"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - microservices-net\n\n`;
  }

  if (hasMysql) {
    compose += `  mysql:
    image: mysql:8.0
    container_name: '${answer.projectName}-mysql'
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: main_db
    ports:
      - '3306:3306'
    volumes:
      - mysql-data:/var/lib/mysql
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost']
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - microservices-net\n\n`;
  }

  // 2. Downstream Services
  for (const s of services) {
    const dbName = `${s.name.replace(/[^a-zA-Z0-9]/g, '_')}_db`;
    const deps: string[] = [];
    if (s.database === 'postgres') deps.push('postgres');
    if (s.database === 'mongodb') deps.push('mongodb');
    if (s.database === 'mysql') deps.push('mysql');

    compose += `  ${s.name}:
    build:
      context: ./services/${s.name}
      dockerfile: Dockerfile
    container_name: '${answer.projectName}-${s.name}'
    restart: unless-stopped
    ports:
      - '${s.port}:${s.port}'
    env_file:
      - services/${s.name}/.env
    environment:
      - PORT=${s.port}
      - SERVICE_NAME=${s.name}
      - GATEWAY_URL=http://gateway:${gateway.port}\n`;

    if (authService && authService.name !== s.name) {
      compose += `      - AUTH_SERVICE_URL=http://${authService.name}:${authService.port}\n`;
    }

    if (s.database === 'postgres') {
      compose += `      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/${dbName}\n`;
    } else if (s.database === 'mongodb') {
      compose += `      - MONGODB_URI=mongodb://mongodb:27017/${dbName}\n`;
    } else if (s.database === 'mysql') {
      compose += `      - DATABASE_URL=mysql://root:rootpassword@mysql:3306/${dbName}\n`;
    }

    if (deps.length > 0) {
      compose += `    depends_on:\n`;
      for (const dep of deps) {
        compose += `      ${dep}:\n        condition: service_healthy\n`;
      }
    }

    compose += `    networks:
      - microservices-net\n\n`;
  }

  // 3. Gateway
  compose += `  gateway:
    build:
      context: ./gateway
      dockerfile: Dockerfile
    container_name: '${answer.projectName}-gateway'
    restart: unless-stopped
    ports:
      - '${gateway.port}:${gateway.port}'
    env_file:
      - gateway/.env
    environment:
      - PORT=${gateway.port}\n`;

  for (const s of services) {
    const envKey = `${s.name.toUpperCase().replace(/-/g, '_')}_URL`;
    compose += `      - ${envKey}=http://${s.name}:${s.port}\n`;
  }

  if (services.length > 0) {
    compose += `    depends_on:\n`;
    for (const s of services) {
      compose += `      - ${s.name}\n`;
    }
  }

  compose += `    networks:
      - microservices-net\n`;

  // 4. Networks & Volumes
  compose += `\nnetworks:
  microservices-net:
    driver: bridge\n`;

  const volumes: string[] = [];
  if (hasPostgres) volumes.push('postgres-data');
  if (hasMongo) volumes.push('mongo-data');
  if (hasMysql) volumes.push('mysql-data');

  if (volumes.length > 0) {
    compose += `\nvolumes:\n`;
    for (const v of volumes) {
      compose += `  ${v}:\n`;
    }
  }

  return compose;
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

  if (answer.appShape === 'microservices') {
    const gateway = answer.gateway ?? {
      stack: 'node',
      framework: 'express',
      port: 8000,
    };
    ops.push({
      path: 'gateway/Dockerfile',
      content: getStandaloneDockerfile(
        gateway.stack,
        gateway.framework,
        `${answer.projectName}-gateway`,
      ),
    });
    ops.push({
      path: 'gateway/.dockerignore',
      content: DOCKERIGNORE_CONTENT,
    });

    const services = answer.services ?? [];
    for (const service of services) {
      ops.push({
        path: `services/${service.name}/Dockerfile`,
        content: getStandaloneDockerfile(
          service.stack,
          service.framework,
          `${answer.projectName}-${service.name}`,
        ),
      });
      ops.push({
        path: `services/${service.name}/.dockerignore`,
        content: DOCKERIGNORE_CONTENT,
      });
    }

    ops.push({
      path: 'docker-compose.yml',
      content: getMicroservicesDockerCompose(answer),
    });
    ops.push({
      path: '.dockerignore',
      content: DOCKERIGNORE_CONTENT,
    });
  } else if (answer.appShape === 'fullstack') {
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
