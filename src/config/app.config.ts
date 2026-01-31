import { registerAs } from '@nestjs/config';
import { IsString, IsInt, Min, Max, validateSync, ValidateNested } from 'class-validator';
import { plainToClass, Type } from 'class-transformer';

class AppConfig {
  @IsString()
  host: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  port: number;
}

class RedisConfig {
  @IsString()
  host: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  port: number;
}

class Config {
  @ValidateNested()
  @Type(() => AppConfig)
  app: AppConfig;
}

export default registerAs('config', () => {
  const config = {
    app: {
      host: process.env.APP_HOST || 'localhost',
      port: parseInt(process.env.APP_PORT, 10) || 3000,
    },
  
  };

  const validatedConfig = plainToClass(Config, config, { enableImplicitConversion: true });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
});
