import { registerAs } from '@nestjs/config';
import {
  IsString,
  IsInt,
  Min,
  Max,
  validateSync,
  IsBoolean,
} from 'class-validator';
import { plainToClass } from 'class-transformer';

class AppConfig {
  @IsString()
  host: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  port: number;

  @IsString()
  frontendUrl: string;

  @IsInt()
  @Min(1)
  abandonedCartTimeMinutes: number;

  @IsBoolean()
  cookieSecure: boolean;

  @IsString()
  cookieSameSite: 'lax' | 'strict' | 'none';
}

export default registerAs('app', () => {
  const config = {
    host: process.env.APP_HOST || 'localhost',
    port: parseInt(process.env.APP_PORT, 10) || 3000,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    abandonedCartTimeMinutes:
      parseInt(process.env.ABANDONED_CART_TIME_MINUTES, 10) || 5,
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    cookieSameSite:
      (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'lax',
  };

  const validatedConfig = plainToClass(AppConfig, config, {
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
