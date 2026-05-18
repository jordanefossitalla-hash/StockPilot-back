import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ClientOrderDeliveryStatusDto } from './client-order.enums';

export class UpdateClientOrderDeliveryStatusDto {
  @ApiProperty({
    enum: ClientOrderDeliveryStatusDto,
    description: 'Nouvel etat de livraison de la commande.',
    example: ClientOrderDeliveryStatusDto.DELIVERED,
  })
  @IsEnum(ClientOrderDeliveryStatusDto)
  deliveryStatus!: ClientOrderDeliveryStatusDto;
}
