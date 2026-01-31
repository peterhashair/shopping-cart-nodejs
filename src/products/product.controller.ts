import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './product.entity';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  index(): Promise<Product[]> {
    return this.productService.index();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
    return this.productService.get(id);
  }

  @Post()
  add(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productService.add(createProductDto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.productService.delete(id);
  }
}
