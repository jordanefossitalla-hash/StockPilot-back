import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ClientOrderPriorityDto } from './client-order.enums';

export class CreateClientOrderDto {
  @ApiProperty({
    description: 'Identifiant du client proprietaire de la commande.',
    example: '8f1fce75-6bcc-4fba-a95c-b3a300e265fd',
  })
  @IsString()
  clientId!: string;

  @ApiProperty({
    description: 'Date a laquelle la commande doit etre livree.',
    example: '2026-05-20T10:30:00.000Z',
  })
  @IsDateString()
  deliveryDueAt!: string;

  @ApiPropertyOptional({
    description: 'Date de prise de commande. Si absente, now() est applique.',
    example: '2026-05-18T09:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  orderedAt?: string;

  @ApiPropertyOptional({
    enum: ClientOrderPriorityDto,
    default: ClientOrderPriorityDto.NORMAL,
    description: 'Priorite de traitement pour l equipe de livraison.',
    example: ClientOrderPriorityDto.HIGH,
  })
  @IsOptional()
  @IsEnum(ClientOrderPriorityDto)
  priority?: ClientOrderPriorityDto;

  @ApiPropertyOptional({
    description: 'Note libre sur la commande (adresse, details, contact).',
    example: 'Livrer avant midi. Appeler le client 15 min avant.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
