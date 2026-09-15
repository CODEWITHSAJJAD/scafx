import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  check() {
    return {
      status: 'ok',
      service: '{{projectName}}',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('api/health')
  checkApi() {
    return {
      status: 'ok',
      service: '{{projectName}}',
      timestamp: new Date().toISOString(),
    };
  }
}
