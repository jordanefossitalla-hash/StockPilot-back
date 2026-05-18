import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum StockHistoryMovementTypeDto {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  ADJUSTMENT = 'ADJUSTMENT',
  SALE = 'SALE',
  ORDER_RECEIVE = 'ORDER_RECEIVE',
}

export class ListStockHistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrer l historique sur un produit specifique.',
    example: 'caecf068-798f-4598-a624-e1e44c076552',
  })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({
    enum: StockHistoryMovementTypeDto,
    description: 'Type de mouvement (entree, sortie, ajustement, vente, reception commande).',
    example: StockHistoryMovementTypeDto.ENTRY,
  })
  @IsOptional()
  @IsEnum(StockHistoryMovementTypeDto)
  type?: StockHistoryMovementTypeDto;

  @ApiPropertyOptional({
    description: 'Recherche textuelle sur produit, motif ou reference.',
    example: 'FAC-9007',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Date minimale du mouvement.',
    example: '2026-05-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Date maximale du mouvement.',
    example: '2026-05-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

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
