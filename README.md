# Universal Project Scaffolder

> A universal project scaffolder CLI across Node, Python, .NET, React, and Flutter with architecture- and database-aware output.

## Monorepo Layout

```
packages/
  core/          # Domain logic & schema contracts (Answer, Manifest, FileOp)
  cli/           # CLI shell (oclif + @clack/prompts)
  preflight/     # Environment preflight checkers & version detection
  templates/     # Golden templates & fragments
```

## Getting Started

### Prerequisites

- Node.js >= 18 (Node.js 20+ recommended)
- pnpm >= 9

### Installation & Build

```bash
pnpm install
pnpm build
pnpm test
```

## License

MIT
