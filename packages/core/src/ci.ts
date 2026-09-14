import type { Answer } from './schema/answer.js';
import type { FileOp } from './types/file-op.js';

export function getProjectCiWorkflow(answer: Answer): string {
  if (answer.appShape === 'fullstack') {
    const frontendStack = answer.frontend?.stack ?? (answer.stack === 'react' ? 'react' : 'react');
    const backendStack =
      answer.backend?.stack ?? (answer.stack !== 'react' ? answer.stack : 'python');

    return `name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test-backend:
    name: Test Backend (${backendStack})
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

      - name: Run tests
        run: pytest

  test-frontend:
    name: Test Frontend (${frontendStack})
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Build frontend
        run: npm run build
`;
  }

  // Standalone CI
  if (answer.stack === 'python') {
    return `name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    name: Test Python (${answer.framework})
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

      - name: Run tests
        run: pytest
`;
  }

  if (answer.stack === 'dotnet') {
    return `name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    name: Test .NET (${answer.framework})
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup .NET SDK
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'

      - name: Restore dependencies
        run: dotnet restore

      - name: Build project
        run: dotnet build --no-restore -c Release

      - name: Run tests
        run: dotnet test --no-build -c Release --verbosity normal
`;
  }

  if (answer.stack === 'flutter') {
    return `name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    name: Test Flutter
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          channel: 'stable'

      - name: Get dependencies
        run: flutter pub get

      - name: Analyze code
        run: flutter analyze

      - name: Run widget tests
        run: flutter test
`;
  }

  // Node & React
  return `name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    name: Test & Build (${answer.stack} + ${answer.framework})
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js 20.x
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint --if-present

      - name: Run unit tests
        run: npm test --if-present

      - name: Build project
        run: npm run build --if-present
`;
}

export function generateProjectCi(answer: Answer): FileOp[] {
  return [
    {
      path: '.github/workflows/ci.yml',
      content: getProjectCiWorkflow(answer),
    },
  ];
}
