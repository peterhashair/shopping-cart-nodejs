import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ProductModule } from '../src/products/product.module';
import { HealthModule } from '../src/health/health.module';
import { RedisModule } from '../src/redis/redis.module';
import { CartModule } from '../src/cart/cart.module';
import { OrderModule } from '../src/order/order.module';
import appConfig from '../src/config/app.config';
import databaseConfig from '../src/config/database.config';
import redisConfig from '../src/config/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const dbConfig = await configService.get('database');
        dbConfig.database = 'shopping_cart_test';
        return {
          ...dbConfig,
        };
      },
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    RedisModule,
    HealthModule,
    ProductModule,
    CartModule,
    OrderModule,
  ],
})
export class TestModule {}
