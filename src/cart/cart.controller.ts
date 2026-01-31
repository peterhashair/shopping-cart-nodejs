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
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { Cart } from './cart.entity';
import type { Request, Response } from 'express';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Req() req: Request): Promise<Cart> {
    const cartId = req.cookies['cartId'];
    return this.cartService.getCart(cartId);
  }

  @Post('items')
  async addToCart(
    @Body() addToCartDto: AddToCartDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Cart> {
    const cartId = req.cookies['cartId'];
    const { productId, quantity } = addToCartDto;
    const cart = await this.cartService.addToCart(cartId, productId, quantity);

    if (!cartId) {
      res.cookie('cartId', cart.id, {
        httpOnly: true,
        // secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        // sameSite: 'strict',
      });
    }

    return cart;
  }

  @Delete('items/:itemId')
  async removeFromCart(
    @Req() req: Request,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<Cart> {
    const cartId = req.cookies['cartId'];
    return this.cartService.removeFromCart(cartId, itemId);
  }

  @Post('checkout')
  async checkout(@Req() req: Request): Promise<{ message: string }> {
    const cartId = req.cookies['cartId'];
    return this.cartService.checkout(cartId);
  }
}
