import { HealthStatus } from '../../domain/entities/health.entity.js';
import { IHealthRepository } from '../../domain/repositories/health.repository.interface.js';

export class InMemoryHealthRepository implements IHealthRepository {
  async getSystemStatus(): Promise<HealthStatus> {
    return {
      status: 'healthy',
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
