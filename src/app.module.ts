import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductModule } from './products/product.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { HealthModule } from './health/health.module';
import redisConfig from './config/redis.config';
import { RedisModule } from './redis/redis.module';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    HealthModule,
    ProductModule,
    CartModule
  ],
})
export class AppModule {}
