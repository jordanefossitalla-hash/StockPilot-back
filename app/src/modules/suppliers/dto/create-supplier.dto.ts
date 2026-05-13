import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export enum SupplierStatusDto {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  WARNING = 'WARNING',
}

export class CreateSupplierDto {
  @ApiProperty({
    example: 'SUP-0001',
    description: 'Code unique du fournisseur.',
  })
  @IsString()
  code!: string;

  @ApiProperty({
    example: 'Global Distribution SARL',
    description: 'Nom commercial du fournisseur.',
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    example: '+237699112233',
    description: 'Numero de telephone principal du fournisseur.',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'contact@global-distribution.cm',
    description: 'Adresse email du fournisseur.',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'Douala, Akwa',
    description: 'Adresse physique du fournisseur.',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    enum: SupplierStatusDto,
    example: SupplierStatusDto.ACTIVE,
    description: 'Statut operationnel du fournisseur.',
  })
  @IsOptional()
  @IsEnum(SupplierStatusDto)
  status?: SupplierStatusDto;
}
