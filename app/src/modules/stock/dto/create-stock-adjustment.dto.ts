import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateStockAdjustmentDto {
  @ApiProperty({
    description: 'Produit concerne.',
    example: 'caecf068-798f-4598-a624-e1e44c076552',
  })
  @IsString()
  productId!: string;

  @ApiProperty({
    description: 'Delta d ajustement (+/-).',
    example: -2,
  })
  @Type(() => Number)
  @IsInt()
  quantityDelta!: number;

  @ApiPropertyOptional({
    description: 'Reference externe (inventaire, audit).',
    example: 'INV-112',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @ApiProperty({
    description: 'Motif d ajustement.',
    example: 'Correction inventaire',
  })
  @IsString()
  @MaxLength(500)
  note?: string;
}
