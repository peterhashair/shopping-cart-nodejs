import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, DataSource, Raw } from 'typeorm';
import { CartItem } from './cart-item.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class CartItemSchedule {
  private readonly logger = new Logger(CartItemSchedule.name);

  // this can be configured as needed, best way put into a database config, each org can control there own time
  private readonly ABANDONED_TIME_MINUTES = 5;

  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    private readonly dataSource: DataSource,
  ) {}

  // this cron job runs every minute to check for abandoned cart items
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.debug('Checking for abandoned cart items...');

    const abandonedItems = await this.cartItemRepository.find({
      where: {
        createdAt: Raw(
          (alias) =>
            `${alias} < NOW() - INTERVAL '${this.ABANDONED_TIME_MINUTES} minutes'`,
        ),
      },
      relations: ['product'],
    });

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
