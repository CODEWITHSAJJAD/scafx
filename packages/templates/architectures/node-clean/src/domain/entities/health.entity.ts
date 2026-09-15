export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  uptimeSeconds: number;
  timestamp: string;
}
