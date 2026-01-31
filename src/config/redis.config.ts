import { registerAs } from '@nestjs/config';
import { IsString, IsInt, Min, Max, validateSync } from 'class-validator';
import { plainToClass } from 'class-transformer';

class RedisConfig {
  @IsString()
  host: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  port: number;

  @IsInt()
  @Min(1)
  redisLockTTL: number;
}

export default registerAs('redis', () => {
  const config = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    redisLockTTL: parseInt(process.env.REDIS_LOCK_TTL, 10) || 5000,
  };
  const validatedConfig = plainToClass(RedisConfig, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
});
