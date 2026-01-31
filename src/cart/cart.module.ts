import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { RedisModule } from '../redis/redis.module';
import { CartService } from './cart.service';
import { Product } from 'src/products/product.entity';
import { CartController } from './cart.controller';
import { OrderModule } from 'src/order/order.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, CartItem, Product]),
    RedisModule,
    OrderModule,
  ],
  providers: [CartService],
  controllers: [CartController],
})
export class CartModule {}
