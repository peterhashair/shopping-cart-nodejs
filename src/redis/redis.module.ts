import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { redisProvider } from './redis.provider';
import { RedisLockService } from './redisLockService';

@Module({
  imports: [ConfigModule],
  providers: [redisProvider, RedisLockService],
  exports: [RedisLockService],
})
export class RedisModule {}
