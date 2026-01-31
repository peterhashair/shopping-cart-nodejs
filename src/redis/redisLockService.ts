import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import Redlock from 'redlock';

@Injectable()
export class RedisLockService {
  private redlock: Redlock;

  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {
    this.redlock = new Redlock([this.redisClient as any], {
      driftFactor: 0.01,
      retryCount: 10,
      retryDelay: 200,
      retryJitter: 200,
    });

    // Essential: Handle errors so they don't crash the process
    this.redlock.on('clientError', (err) => {
      if (err.name === 'ExecutionError') {
        console.error('A redis error has occurred:', err);
      }
      throw err;
    });
  }

  /**
   * withLock wraps a task in a distributed lock.
   * Uses the 'using' pattern to handle auto-release and clock drift.
   */
  async withLock<T>(resource: string, task: () => Promise<T>): Promise<T> {
    const lock = await this.redlock.acquire([`locks:${resource}`], 5000);
    try {
      return await task();
    } finally {
      // Release the lock.
      await (lock as any).release();
    }
  }

  onModuleDestroy() {
    // Clean up connections if necessary
    this.redlock.quit();
  }
}
