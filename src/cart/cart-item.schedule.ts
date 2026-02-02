import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CartItem } from './cart-item.entity';
import { Product } from '../products/product.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CartItemSchedule {
  private readonly logger = new Logger(CartItemSchedule.name);
  private readonly ABANDONED_TIME_MINUTES: number;

  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.ABANDONED_TIME_MINUTES = this.configService.get<number>(
      'app.abandonedCartTimeMinutes',
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.debug('Checking for abandoned cart items...');

    // Calculate the cutoff time in JavaScript to avoid SQL injection
    const cutoffTime = new Date();
    cutoffTime.setMinutes(
      cutoffTime.getMinutes() - this.ABANDONED_TIME_MINUTES,
    );

    const abandonedItems = await this.cartItemRepository
      .createQueryBuilder('cartItem')
      .leftJoinAndSelect('cartItem.product', 'product')
      .where('cartItem.createdAt < :cutoffTime', { cutoffTime })
      .getMany();

    if (abandonedItems.length === 0) {
      this.logger.debug('No abandoned cart items found.');
      return;
    }

    this.logger.log(
      `Found ${abandonedItems.length} abandoned items. Reverting stock...`,
    );

    // Revert stock and remove abandoned cart items in a transaction
    await this.dataSource.transaction(async (manager) => {
      for (const item of abandonedItems) {
        const product = item.product;
        if (product) {
          // Revert the stock
          product.stock += item.quantity;
          await manager.save(Product, product);
        }
        // Remove the abandoned cart item
        await manager.remove(CartItem, item);
      }
    });

    this.logger.log('Finished reverting stock for abandoned cart items.');
  }
}
