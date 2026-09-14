# Express API Gateway

High-performance Express API Gateway in TypeScript for microservices orchestration, request correlation tracking, reverse proxying, and unified CORS.

## Features

- **Reverse Proxy Routing**: Delegates `/api/*` subroutes to corresponding downstream microservice containers or local ports.
- **Request Tracing**: Injects and passes `x-request-id` correlation headers across all downstream service invocations.
- **Aggregated Health Check**: `GET /health` summarizes gateway readiness and downstream target URLs.
- **CORS Handling**: Configured out of the box for multi-client access.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production
npm run build
```
