import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { OrderService } from './order.service';
import { Product } from 'src/products/product.entity';
import { Cart } from 'src/cart/cart.entity';
import { CartItem } from 'src/cart/cart-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product, Cart, CartItem]),
  ],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
