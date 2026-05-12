import { IsEnum, IsOptional } from 'class-validator';
import { SaleStatusDto } from './list-sales-query.dto';

export class UpdateSaleDto {
  @IsOptional()
  @IsEnum(SaleStatusDto)
  status?: SaleStatusDto;
}
