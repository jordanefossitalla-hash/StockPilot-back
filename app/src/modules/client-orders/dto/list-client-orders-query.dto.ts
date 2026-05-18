import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ClientOrderDeliveryStatusDto, ClientOrderPriorityDto } from './client-order.enums';

export class ListClientOrdersQueryDto {
  @ApiPropertyOptional({
    enum: ClientOrderDeliveryStatusDto,
    description: 'Filtre par etat de livraison.',
    example: ClientOrderDeliveryStatusDto.TO_DELIVER,
  })
  @IsOptional()
  @IsEnum(ClientOrderDeliveryStatusDto)
  deliveryStatus?: ClientOrderDeliveryStatusDto;

  @ApiPropertyOptional({
    enum: ClientOrderPriorityDto,
    description: 'Filtre par priorite.',
    example: ClientOrderPriorityDto.HIGH,
  })
  @IsOptional()
  @IsEnum(ClientOrderPriorityDto)
  priority?: ClientOrderPriorityDto;

  @ApiPropertyOptional({
    description: 'Filtre par client.',
    example: '8f1fce75-6bcc-4fba-a95c-b3a300e265fd',
  })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({
    description: 'Date minimale de livraison prevue (ISO 8601).',
    example: '2026-05-18T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Date maximale de livraison prevue (ISO 8601).',
    example: '2026-05-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: 'Numero de page (>= 1).',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Taille de page (1..100).',
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
