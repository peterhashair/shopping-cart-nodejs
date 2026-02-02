import {
  IsString,
  IsInt,
  Min,
  Max,
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
  @Max(1000) // Prevent DoS attacks with unreasonably large quantities
  quantity: number;
}
