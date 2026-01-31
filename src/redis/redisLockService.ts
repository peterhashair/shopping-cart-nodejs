import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import Redlock from 'redlock';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisLockService implements OnModuleDestroy {
  private redlock: Redlock;
  private readonly REDIS_LOCK_TTL: number;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private readonly configService: ConfigService,
  ) {
    this.redlock = new Redlock([this.redisClient as any], {
      driftFactor: 0.01,
      retryCount: 10,
      retryDelay: 200,
      retryJitter: 200,
    });

    this.REDIS_LOCK_TTL = this.configService.get<number>('redis.redisLockTTL');

    this.redlock.on('clientError', (err: Error) => {
      if (err.name === 'ExecutionError') {
        console.error('A redis error has occurred:', err);
      } else {
        // Log other Redlock client errors without re-throwing to prevent process crashes
        console.error('Redlock client error:', err);
      }
    });
  }

  async withLock<T>(resource: string, task: () => Promise<T>): Promise<T> {
    const lock = await this.redlock.acquire(
      [`locks:${resource}`],
      this.REDIS_LOCK_TTL,
    );
    try {
      return await task();
    } finally {
      await (lock as any).release();
    }
  }

  onModuleDestroy() {
    this.redlock.quit();
  }
}
