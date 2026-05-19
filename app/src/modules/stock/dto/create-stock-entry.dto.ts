import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateStockEntryDto {
  @ApiProperty({
    description: 'Fournisseur lie a cette entree de stock.',
    example: 'f03d4ac8-4c52-46ff-aabf-43869359d6d0',
  })
  @IsString()
  supplierId!: string;

  @ApiProperty({
    description: 'Produit concerne.',
    example: 'caecf068-798f-4598-a624-e1e44c076552',
  })
  @IsString()
  productId!: string;

  @ApiProperty({ description: 'Quantite a ajouter.', example: 6 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ description: 'Cout unitaire d acquisition.', example: 9200 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitCost!: number;

  @ApiPropertyOptional({
    description: 'Reference externe (bon, facture, inventaire).',
    example: 'BON-4455',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @ApiProperty({
    description: 'Motif du mouvement.',
    example: 'Reapprovisionnement fournisseur',
  })
  @IsString()
  @MaxLength(500)
  note?: string;
}
