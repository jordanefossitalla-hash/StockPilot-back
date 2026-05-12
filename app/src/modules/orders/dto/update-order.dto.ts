import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatusDto } from './list-orders-query.dto';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatusDto)
  status?: OrderStatusDto;
}
