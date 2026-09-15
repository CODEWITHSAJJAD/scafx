import { HealthStatus } from '../entities/health.entity.js';

export interface IHealthRepository {
  getSystemStatus(): Promise<HealthStatus>;
}
