import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { Product } from 'src/products/product.entity';
import { RedisLockService } from 'src/redis/redisLockService';
import { OrderService } from 'src/order/order.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly lockService: RedisLockService,
    private readonly orderService: OrderService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getCart(cartId: string): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items', 'items.product'],
    });
    if (!cart) {
      const newCart = this.cartRepository.create({ id: cartId, items: [] });
      return this.cartRepository.save(newCart);
    }
    return cart;
  }

  async addToCart(
    cartId: string | null,
    productId: string,
    quantity: number,
  ): Promise<Cart> {
    return this.lockService.withLock(`product:${productId}`, async () => {
      const product = await this.productRepository.findOne({
        where: { id: productId },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      if (product.stock < quantity) {
        throw new BadRequestException('Not enough stock');
      }

      let cart: Cart;
      if (cartId) {
        cart = await this.cartRepository.findOne({
          where: { id: cartId },
          relations: ['items', 'items.product'],
        });
        if (!cart) {
          throw new NotFoundException('Cart not found');
        }
      } else {
        // Create and save the new cart to ensure it has an ID
        const newCart = this.cartRepository.create({ items: [] });
        cart = await this.cartRepository.save(newCart);
      }

      let cartItem = cart.items.find((item) => item.product.id === productId);
      if (cartItem) {
        cartItem.quantity += quantity;
      } else {
        cartItem = this.cartItemRepository.create({ cart, product, quantity });
        cart.items.push(cartItem);
      }

      // Use transaction to ensure atomicity of cart save and stock decrement
      const result = await this.dataSource.transaction(async (manager) => {
        const savedCart = await manager.save(Cart, cart);
        product.stock -= quantity;
        await manager.save(Product, product);
        return savedCart;
      });

      // Return the updated cart with relations loaded
      const updatedCart = await this.cartRepository.findOne({
        where: { id: result.id },
        relations: ['items', 'items.product'],
      });

      if (!updatedCart) {
        throw new NotFoundException('Cart not found after transaction');
      }

      return updatedCart;
    });
  }

  /***
   * Remove item from cart and revert stock
   */
  async removeFromCart(cartId: string, cartItemId: string): Promise<Cart> {
    return this.lockService.withLock(`cart:${cartId}`, async () => {
      const cart = await this.cartRepository.findOne({
        where: { id: cartId },
        relations: ['items', 'items.product'],
      });
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }

      const cartItemIndex = cart.items.findIndex(
        (item) => item.id === cartItemId,
      );
      if (cartItemIndex === -1) {
        throw new NotFoundException('Cart item not found');
      }

      const cartItem = cart.items[cartItemIndex];
      const product = cartItem.product;

      product.stock += cartItem.quantity;
      await this.productRepository.save(product);

      await this.cartItemRepository.remove(cartItem);
      cart.items.splice(cartItemIndex, 1);

      return this.cartRepository.save(cart);
    });
  }

  /***
   * Checkout the cart by creating an order and clearing the cart items
   */
  async checkout(cartId: string): Promise<{ message: string }> {
    return this.lockService.withLock(`cart:${cartId}`, async () => {
      const cart = await this.cartRepository.findOne({
        where: { id: cartId },
        relations: ['items', 'items.product'],
      });
      if (!cart || cart.items.length === 0) {
        throw new NotFoundException('Cart is empty or not found');
      }

      // In a real application, you would process the payment here.
      // For this example, we'll just clear the cart.

      await this.orderService.createOrderFromCart(cart);

      return { message: 'Checkout successful' };
    });
  }
}
