import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum ClientStatusDto {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  WARNING = 'WARNING',
}

export class CreateClientDto {
  @ApiProperty({
    example: 'CLI-0001',
    description: 'Code unique du client.',
  })
  @IsString()
  code!: string;

  @ApiProperty({
    example: 'Boutique Mboa',
    description: 'Nom commercial du client.',
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    example: '+237695947075',
    description: 'Numero de telephone principal du client.',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'contact@boutique-mboa.cm',
    description: 'Adresse email du client.',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'Yaounde, Bastos',
    description: 'Adresse physique du client.',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    enum: ClientStatusDto,
    example: ClientStatusDto.ACTIVE,
    description: 'Statut operationnel du client.',
  })
  @IsOptional()
  @IsEnum(ClientStatusDto)
  status?: ClientStatusDto;

  @ApiPropertyOptional({
    example: 25000,
    description: 'Solde initial du client a la creation.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  balance?: number;
}
