import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { SupplierStatusDto } from './create-supplier.dto';

export class ListSuppliersQueryDto {
  @ApiPropertyOptional({
    example: 'global',
    description: 'Recherche partielle sur le nom du fournisseur.',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: SupplierStatusDto,
    example: SupplierStatusDto.ACTIVE,
    description: 'Filtrer les fournisseurs par statut.',
  })
  @IsOptional()
  @IsEnum(SupplierStatusDto)
  status?: SupplierStatusDto;

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
