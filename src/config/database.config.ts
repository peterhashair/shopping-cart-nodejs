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

class DatabaseConfig {
  @IsString()
  type: string;

  @IsString()
  host: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  port: number;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  database: string;

  @IsBoolean()
  synchronize: boolean;

  @IsString({ each: true })
  entities: string[];
}

export default registerAs('database', () => {
  const config = {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USER || 'user',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: process.env.DATABASE_NAME || 'shoppingcart',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV !== 'production',
  };

  const validatedConfig = plainToClass(DatabaseConfig, config, {
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
