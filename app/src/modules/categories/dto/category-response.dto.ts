import { ApiProperty } from '@nestjs/swagger';
import { CategoryStatusDto } from './create-category.dto';

export class CategoryItemDto {
  @ApiProperty({
    example: '0f7e3d8b-6c42-4d8f-bf75-6ac1c2fd7e2e',
    description: 'Identifiant UUID de la categorie.',
  })
  id!: string;

  @ApiProperty({
    example: 'Boissons',
    description: 'Nom unique de la categorie.',
  })
  name!: string;

  @ApiProperty({
    example: 'Produits liquides vendus a l unite ou par carton.',
    nullable: true,
    description: 'Description libre de la categorie.',
  })
  description!: string | null;

  @ApiProperty({
    enum: CategoryStatusDto,
    example: CategoryStatusDto.ACTIVE,
    description: 'Statut operationnel de la categorie.',
  })
  status!: CategoryStatusDto;

  @ApiProperty({
    example: '2026-05-15T10:30:00.000Z',
    description: 'Date de creation de la categorie.',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2026-05-15T10:30:00.000Z',
    description: 'Date de derniere mise a jour de la categorie.',
  })
  updatedAt!: string;

  @ApiProperty({
    example: 12,
    description: 'Nombre de produits rattaches a la categorie.',
  })
  productCount!: number;
}

export class CategoryMetaDto {
  @ApiProperty({ example: 1, description: 'Page courante.' })
  page!: number;

  @ApiProperty({ example: 20, description: 'Nombre d elements par page.' })
  limit!: number;

  @ApiProperty({ example: 3, description: 'Nombre total de categories correspondant au filtre.' })
  total!: number;
}

export class CategoryResponseDto {
  @ApiProperty({ type: CategoryItemDto })
  data!: CategoryItemDto;
}

export class CategoryListResponseDto {
  @ApiProperty({ type: [CategoryItemDto] })
  data!: CategoryItemDto[];

  @ApiProperty({ type: CategoryMetaDto })
  meta!: CategoryMetaDto;
}

export class CategoryDeleteDataDto {
  @ApiProperty({
    example: '0f7e3d8b-6c42-4d8f-bf75-6ac1c2fd7e2e',
    description: 'Identifiant UUID de la categorie supprimee.',
  })
  id!: string;
}

export class CategoryDeleteResponseDto {
  @ApiProperty({ type: CategoryDeleteDataDto })
  data!: CategoryDeleteDataDto;
}