import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'stockpilot-backend',
      timestamp: new Date().toISOString(),
    };
  }

  getReadiness() {
    return {
      status: 'ready',
      service: 'stockpilot-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
