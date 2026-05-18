import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ClientOrderPriorityDto } from './client-order.enums';

export class UpdateClientOrderPriorityDto {
  @ApiProperty({
    enum: ClientOrderPriorityDto,
    description: 'Nouvelle priorite de livraison.',
    example: ClientOrderPriorityDto.HIGH,
  })
  @IsEnum(ClientOrderPriorityDto)
  priority!: ClientOrderPriorityDto;
}
