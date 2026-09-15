import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      message: 'Welcome to {{projectName}} API',
      stack: '{{stack}}',
      framework: '{{framework}}',
    };
  }
}
