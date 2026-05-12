import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateStockAdjustmentDto {
  @IsString()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  quantityDelta!: number;

  @IsOptional()
  @IsString()
  note?: string;
}
