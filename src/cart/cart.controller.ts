import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  Get,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { Cart } from './cart.entity';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('cart')
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async getCart(@Req() req: Request): Promise<Cart> {
    const cartId =
      (req.cookies['cartId'] as string | undefined) || req.header('X-Cart-ID');
    if (!cartId) {
      throw new BadRequestException('Cart session not found.');
    }
    return this.cartService.getCart(cartId);
  }

  @Post('items')
  async addToCart(
    @Body() addToCartDto: AddToCartDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Cart> {
    const cartId =
      (req.cookies['cartId'] as string | undefined) || req.header('X-Cart-ID');
    const { productId, quantity } = addToCartDto;
    const cart = await this.cartService.addToCart(cartId, productId, quantity);

    if (!cartId) {
      res.cookie('cartId', cart.id, {
        httpOnly: true,
        secure: this.configService.get<boolean>('app.cookieSecure'),
        sameSite: this.configService.get<'lax' | 'strict' | 'none'>(
          'app.cookieSameSite',
        ),
      });
      res.setHeader('X-Cart-ID', cart.id);
    }

    return cart;
  }

  @Delete('items/:itemId')
  async removeFromCart(
    @Req() req: Request,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<Cart> {
    const cartId =
      (req.cookies['cartId'] as string | undefined) || req.header('X-Cart-ID');
    if (!cartId) {
      throw new BadRequestException('Cart session not found.');
    }
    return this.cartService.removeFromCart(cartId, itemId);
  }

  @Post('checkout')
  async checkout(@Req() req: Request): Promise<{ message: string }> {
    const cartId =
      (req.cookies['cartId'] as string | undefined) || req.header('X-Cart-ID');
    if (!cartId) {
      throw new BadRequestException('Cart session not found.');
    }
    return this.cartService.checkout(cartId);
  }
}
