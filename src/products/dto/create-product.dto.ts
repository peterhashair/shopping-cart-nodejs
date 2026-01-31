import { IsString, IsInt, IsOptional, Min, IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  priceCents: number;

  @IsInt()
  @Min(0)
  stock: number;

  @IsOptional()
  @IsString()
  category?: string;
}
