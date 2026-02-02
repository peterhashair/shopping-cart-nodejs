import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Cart } from '../cart/cart.entity';
import { CartItem } from 'src/cart/cart-item.entity';

@Injectable()
export class OrderService {
  // Maximum allowed order total in cents for decimal(10,2): 99,999,999.99
  private readonly MAX_ORDER_TOTAL_CENTS = 9999999999;

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

      // Calculate total - prices are already in cents (from priceCents field)
      // Order total is stored as cents in a decimal field
      const calculatedTotal = order.items.reduce((total, item) => {
        const price = Number(item.price);
        if (isNaN(price)) {
          throw new BadRequestException('Invalid price value for order item');
        }
        return total + price * item.quantity;
      }, 0);

      // Ensure result fits in decimal(10,2) - max value is 99,999,999.99 in cents (9,999,999,999)
      if (calculatedTotal > this.MAX_ORDER_TOTAL_CENTS) {
        throw new BadRequestException(
          'Order total exceeds maximum allowed value',
        );
      }

      order.total = calculatedTotal;

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
