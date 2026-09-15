import { HealthStatus } from '../../domain/entities/health.entity.js';
import { IHealthRepository } from '../../domain/repositories/health.repository.interface.js';

export class GetHealthUseCase {
  constructor(private readonly healthRepo: IHealthRepository) {}

  async execute(): Promise<HealthStatus> {
    return this.healthRepo.getSystemStatus();
  }
}
