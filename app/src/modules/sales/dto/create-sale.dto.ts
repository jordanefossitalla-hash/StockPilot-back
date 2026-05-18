import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { IsNumber, Min } from 'class-validator';

export class CreateSaleItemDto {
  @ApiProperty({
    description: 'Produit vendu.',
    example: 'caecf068-798f-4598-a624-e1e44c076552',
  })
  @IsString()
  productId!: string;

  @ApiProperty({
    description: 'Quantite vendue.',
    example: 2,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({
    description: 'Prix unitaire de vente.',
    example: 14500,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;
}

export class CreateSaleDto {
  @ApiPropertyOptional({
    description: 'Client acheteur (optionnel).',
    example: '8f1fce75-6bcc-4fba-a95c-b3a300e265fd',
  })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({
    description:
      'Commande client liee. Si renseignee, la commande passe automatiquement en DELIVERED lors de la creation de la vente.',
    example: 'a6e51893-e2b2-47f7-bd5d-f8daf452758c',
  })
  @IsOptional()
  @IsString()
  clientOrderId?: string;

  @ApiProperty({
    type: [CreateSaleItemDto],
    description: 'Lignes de vente.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items!: CreateSaleItemDto[];

  @ApiPropertyOptional({
    description: 'Montant deja regle a la creation.',
    example: 5000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  paidAmount?: number;

  @ApiPropertyOptional({
    description: 'Note complementaire de la vente.',
    example: 'Paiement partiel a la commande.',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
