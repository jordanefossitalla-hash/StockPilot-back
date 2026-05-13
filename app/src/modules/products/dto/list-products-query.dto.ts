import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ProductStatusDto } from './create-product.dto';

export class ListProductsQueryDto {
  @ApiPropertyOptional({
    example: 'riz',
    description: 'Recherche partielle sur le nom du produit.',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'd3b07384-d9a5-4f8d-a4d5-5f8db57f90ad',
    description: 'Filtrer par identifiant UUID de categorie.',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    enum: ProductStatusDto,
    example: ProductStatusDto.ACTIVE,
    description: 'Filtrer les produits par statut.',
  })
  @IsOptional()
  @IsEnum(ProductStatusDto)
  status?: ProductStatusDto;

  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    description: 'Numero de page (pagination).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    minimum: 1,
    maximum: 100,
    description: 'Taille de page (1 a 100).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
