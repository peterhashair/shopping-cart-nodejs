import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
  private readonly MAX_PRODUCTS_PER_PAGE = 100;

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async index(
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Enforce maximum limit to prevent DoS
    const maxLimit = Math.min(limit, this.MAX_PRODUCTS_PER_PAGE);
    const skip = (page - 1) * maxLimit;

    const [products, total] = await this.productRepository.findAndCount({
      skip,
      take: maxLimit,
    });

    return {
      products,
      total,
      page,
      limit: maxLimit,
    };
  }

  async get(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return product;
  }

  async add(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    try {
      return await this.productRepository.save(product);
    } catch (error) {
      const driverError = error as { code?: string };

      if (driverError.code === '23505') {
        // 23505 is the code for unique_violation in Postgres
        throw new ConflictException('Product with this name already exists');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.productRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
  }
}
