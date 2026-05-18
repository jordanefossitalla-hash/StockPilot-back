import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum StockLevelFilterDto {
  ALL = 'ALL',
  OUT = 'OUT',
  LOW = 'LOW',
  AVAILABLE = 'AVAILABLE',
}

export class ListStockStatusQueryDto {
  @ApiPropertyOptional({
    description: 'Recherche textuelle sur produit, code SKU ou categorie.',
    example: 'Informatique',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtre legacy: true retourne uniquement stock faible ou rupture.',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  lowStockOnly?: boolean;

  @ApiPropertyOptional({
    enum: StockLevelFilterDto,
    description: 'Niveau de stock: tous, rupture, faible ou disponible.',
    example: StockLevelFilterDto.LOW,
  })
  @IsOptional()
  @IsEnum(StockLevelFilterDto)
  stockLevel?: StockLevelFilterDto;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
