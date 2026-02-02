import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Cart } from '../cart/cart.entity';
import { CartItem } from 'src/cart/cart-item.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async createOrderFromCart(cart: Cart): Promise<Order> {
    // Ensure the cart has items
    if (cart.items.length === 0) {
      throw new NotFoundException('Cart is empty');
    }

    try {
      const order = this.orderRepository.create();
      order.items = cart.items.map((cartItem) => {
        const orderItem = new OrderItem();
        orderItem.product = cartItem.product;
        orderItem.quantity = cartItem.quantity;
        orderItem.price = cartItem.product.priceCents;

        return orderItem;
      });

      // Calculate total with proper handling of large numbers
      // Convert to cents for accurate calculation, then back to decimal
      const totalInCents = order.items.reduce(
        (total, item) => total + Number(item.price) * item.quantity,
        0,
      );

      // Ensure result fits in decimal(10,2) - max value is 99,999,999.99
      if (totalInCents > 9999999999) {
        throw new Error('Order total exceeds maximum allowed value');
      }

      order.total = totalInCents;

      // clean the cart and save the order in a transaction
      await this.dataSource.transaction(async (manager) => {
        await manager.save(Order, order);
        await manager.remove(CartItem, cart.items);
        await manager.save(Cart, { ...cart, items: [], deletedAt: new Date() });
      });

      return order;
    } catch (error) {
      throw new Error('Failed to create order from cart', { cause: error });
    }
  }

  // Additional you can also create order through endpoint directly without cart
}
