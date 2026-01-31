import {
  IsString,
  IsInt,
  Min,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class AddToCartDto {
  @IsOptional()
  @IsUUID()
  cartId?: string;

  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
