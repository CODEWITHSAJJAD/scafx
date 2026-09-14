import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

const app = express();
const PORT = process.env.GATEWAY_PORT || process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Correlation ID & Request Logger Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId =
    req.headers['x-request-id'] ||
    `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId as string);
  console.log(`[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.originalUrl}`);
  next();
});

// Dynamic Service Route Table Definition
export interface ServiceRoute {
  name: string;
  prefix: string;
  envUrl: string;
  defaultTarget: string;
}

export const serviceRoutes: ServiceRoute[] = [
  {
    name: 'auth-service',
    prefix: '/api/auth',
    envUrl: 'AUTH_SERVICE_URL',
    defaultTarget: 'http://localhost:8001',
  },
  {
    name: 'catalog-service',
    prefix: '/api/catalog',
    envUrl: 'CATALOG_SERVICE_URL',
    defaultTarget: 'http://localhost:8002',
  },
  {
    name: 'order-service',
    prefix: '/api/orders',
    envUrl: 'ORDER_SERVICE_URL',
    defaultTarget: 'http://localhost:8003',
  },
];

// Aggregated Gateway Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    routes: serviceRoutes.map((r) => ({
      name: r.name,
      prefix: r.prefix,
      target: process.env[r.envUrl] || r.defaultTarget,
    })),
  });
});

// Register Reverse Proxy Middleware for each microservice route
serviceRoutes.forEach((route) => {
  const target = process.env[route.envUrl] || route.defaultTarget;
  app.use(
    route.prefix,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        [`^${route.prefix}`]: '',
      },
    }),
  );
});

// 404 Fallback for Unmatched Routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `No microservice route registered for ${req.method} ${req.originalUrl}`,
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
    console.log(`   Healthcheck endpoint: http://localhost:${PORT}/health`);
  });
}

export { app };
