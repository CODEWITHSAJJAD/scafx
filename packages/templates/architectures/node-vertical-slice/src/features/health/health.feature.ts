import { Request, Response, Router } from 'express';

export interface HealthResponseDto {
  status: 'ok';
  service: string;
  uptime: number;
}

export function createHealthRouter(serviceName = '{{projectName}}'): Router {
  const router = Router();

  router.get('/health', (req: Request, res: Response) => {
    const data: HealthResponseDto = {
      status: 'ok',
      service: serviceName,
      uptime: process.uptime(),
    };
    res.json(data);
  });

  return router;
}
