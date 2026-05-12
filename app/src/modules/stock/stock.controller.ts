import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { StockService } from './stock.service';
import { ListStockStatusQueryDto } from './dto/list-stock-status-query.dto';
import { ListStockHistoryQueryDto } from './dto/list-stock-history-query.dto';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';
import { CreateStockExitDto } from './dto/create-stock-exit.dto';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';

@Controller('stock')
export class StockController {
	constructor(private readonly stockService: StockService) {}

	@Get('status')
	getStatus(@Query() query: ListStockStatusQueryDto) {
		return this.stockService.getStatus(query);
	}

	@Get('history')
	getHistory(@Query() query: ListStockHistoryQueryDto) {
		return this.stockService.getHistory(query);
	}

	@Post('entries')
	createEntry(@Body() dto: CreateStockEntryDto) {
		return this.stockService.createEntry(dto);
	}

	@Post('exits')
	createExit(@Body() dto: CreateStockExitDto) {
		return this.stockService.createExit(dto);
	}

	@Post('adjustments')
	createAdjustment(@Body() dto: CreateStockAdjustmentDto) {
		return this.stockService.createAdjustment(dto);
	}
}
