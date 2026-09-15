import { Request, Response } from 'express';
import { GetHealthUseCase } from '../../application/use-cases/get-health.use-case.js';
import { InMemoryHealthRepository } from '../../infrastructure/repositories/in-memory-health.repository.js';

const healthRepo = new InMemoryHealthRepository();
const getHealthUseCase = new GetHealthUseCase(healthRepo);

export async function handleGetHealth(req: Request, res: Response): Promise<void> {
  const result = await getHealthUseCase.execute();
  res.json(result);
}
