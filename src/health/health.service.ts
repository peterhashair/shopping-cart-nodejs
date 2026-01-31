import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  /** Simple method to check service health */
  getHello(): string {
    return 'Hello World!';
  }
}
