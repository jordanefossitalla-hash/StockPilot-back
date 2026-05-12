import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSalePaymentDto } from './dto/create-sale-payment.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ListSalesQueryDto } from './dto/list-sales-query.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

@Controller('sales')
export class SalesController {
	constructor(private readonly salesService: SalesService) {}

	@Get()
	findAll(@Query() query: ListSalesQueryDto) {
		return this.salesService.findAll(query);
	}

	@Post()
	create(@Body() dto: CreateSaleDto) {
		return this.salesService.create(dto);
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.salesService.findOne(id);
	}

	@Patch(':id')
	update(@Param('id') id: string, @Body() dto: UpdateSaleDto) {
		return this.salesService.update(id, dto);
	}

	@Post(':id/payments')
	addPayment(@Param('id') id: string, @Body() dto: CreateSalePaymentDto) {
		return this.salesService.addPayment(id, dto);
	}

	@Post(':id/cancel')
	cancel(@Param('id') id: string) {
		return this.salesService.cancel(id);
	}
}
