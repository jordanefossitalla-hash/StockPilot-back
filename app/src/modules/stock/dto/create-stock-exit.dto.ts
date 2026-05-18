import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateStockExitDto {
  @ApiProperty({
    description: 'Produit concerne.',
    example: 'caecf068-798f-4598-a624-e1e44c076552',
  })
  @IsString()
  productId!: string;

  @ApiProperty({ description: 'Quantite a sortir.', example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({
    description: 'Reference externe (facture, ticket, ordre interne).',
    example: 'FAC-9020',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @ApiProperty({
    description: 'Motif de sortie.',
    example: 'Sortie pour vente',
  })
  @IsString()
  @MaxLength(500)
  note?: string;
}
