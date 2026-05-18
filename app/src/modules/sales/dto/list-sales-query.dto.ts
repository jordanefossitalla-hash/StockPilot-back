import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum SaleStatusDto {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export class ListSalesQueryDto {
  @ApiPropertyOptional({
    enum: SaleStatusDto,
    description: 'Filtre par statut de vente.',
    example: SaleStatusDto.PAID,
  })
  @IsOptional()
  @IsEnum(SaleStatusDto)
  status?: SaleStatusDto;

  @ApiPropertyOptional({
    description: 'Date minimale de vente (ISO 8601).',
    example: '2026-05-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Date maximale de vente (ISO 8601).',
    example: '2026-05-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: 'Filtre sur un client precis.',
    example: '8f1fce75-6bcc-4fba-a95c-b3a300e265fd',
  })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({
    description: 'Recherche sur code vente, nom client, SKU ou nom produit.',
    example: 'POS Terminal',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Numero de page (>= 1).',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Taille de page (1..100).',
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
