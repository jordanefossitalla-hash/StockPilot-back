import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum ProductStatusDto {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateProductDto {
  @ApiProperty({
    example: 'SKU-0001',
    description: 'Code SKU unique du produit.',
  })
  @IsString()
  sku!: string;

  @ApiProperty({
    example: 'Sac riz 25kg',
    description: 'Nom du produit.',
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    example: 'd3b07384-d9a5-4f8d-a4d5-5f8db57f90ad',
    description: 'Identifiant UUID de la categorie du produit.',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({
    example: 12500,
    minimum: 0,
    description: 'Prix de revient unitaire.',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPrice!: number;

  @ApiProperty({
    example: 14990,
    minimum: 0,
    description: 'Prix de vente unitaire.',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salePrice!: number;

  @ApiPropertyOptional({
    example: 100,
    minimum: 0,
    description: 'Quantite initiale en stock.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({
    example: 10,
    minimum: 0,
    description: 'Seuil minimal de stock avant alerte.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockMinThreshold?: number;

  @ApiPropertyOptional({
    enum: ProductStatusDto,
    example: ProductStatusDto.ACTIVE,
    description: 'Statut operationnel du produit.',
  })
  @IsOptional()
  @IsEnum(ProductStatusDto)
  status?: ProductStatusDto;
}
