import {
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  Column,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @CreateDateColumn()
  createdAt: Date;
}
