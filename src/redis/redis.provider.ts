import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const redisProvider: Provider = {
  provide: 'REDIS_CLIENT',
  useFactory: (
    configService: ConfigService<{ redis: { host: string; port: number } }>,
  ) => {
    const redisConfig = configService.get('redis', { infer: true });
    return new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
    });
  },
  inject: [ConfigService],
};
