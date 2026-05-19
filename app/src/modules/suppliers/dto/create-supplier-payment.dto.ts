import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSupplierPaymentDto {
  @ApiProperty({
    description: 'Montant verse au fournisseur.',
    example: 125000,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({
    description: 'Date effective du versement.',
    example: '2026-05-19T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({
    description: 'Utilisateur ou source qui a enregistre le paiement.',
    example: 'cashier-01',
  })
  @IsOptional()
  @IsString()
  recordedBy?: string;
}
