import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { ReceiveOrderDto } from './dto/receive-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('orders')
export class OrdersController {
	constructor(private readonly ordersService: OrdersService) {}

	@Get()
	findAll(@Query() query: ListOrdersQueryDto) {
		return this.ordersService.findAll(query);
	}

	@Post()
	create(@Body() dto: CreateOrderDto) {
		return this.ordersService.create(dto);
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.ordersService.findOne(id);
	}

	@Patch(':id')
	update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
		return this.ordersService.update(id, dto);
	}

	@Post(':id/receive')
	receive(@Param('id') id: string, @Body() dto: ReceiveOrderDto) {
		return this.ordersService.receive(id, dto);
	}

	@Post(':id/cancel')
	cancel(@Param('id') id: string) {
		return this.ordersService.cancel(id);
	}
}
