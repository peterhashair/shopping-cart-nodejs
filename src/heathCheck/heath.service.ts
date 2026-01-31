import { Injectable } from '@nestjs/common';

@Injectable()
export class HeathService {
  getHello(): string {
    return 'Hello World!';
  }
}
