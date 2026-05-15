import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum CategoryStatusDto {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Boissons',
    description: 'Nom unique de la categorie.',
  })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    example: 'Produits liquides vendus a l unite ou en pack.',
    description: 'Description fonctionnelle de la categorie.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    enum: CategoryStatusDto,
    example: CategoryStatusDto.ACTIVE,
    description: 'Statut operationnel de la categorie.',
    default: CategoryStatusDto.ACTIVE,
  })
  @IsOptional()
  @IsEnum(CategoryStatusDto)
  status?: CategoryStatusDto;
}