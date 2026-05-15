import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CategoryStatusDto } from './create-category.dto';

export class ListCategoriesQueryDto {
  @ApiPropertyOptional({
    example: 'bois',
    description: 'Recherche textuelle partielle sur le nom ou la description.',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: CategoryStatusDto,
    example: CategoryStatusDto.ACTIVE,
    description: 'Filtrer les categories par statut.',
  })
  @IsOptional()
  @IsEnum(CategoryStatusDto)
  status?: CategoryStatusDto;

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