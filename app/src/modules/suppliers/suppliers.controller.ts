import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { ListSuppliersQueryDto } from './dto/list-suppliers-query.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Controller('suppliers')
export class SuppliersController {
	constructor(private readonly suppliersService: SuppliersService) {}

	@Get()
	findAll(@Query() query: ListSuppliersQueryDto) {
		return this.suppliersService.findAll(query);
	}

	@Post()
	create(@Body() dto: CreateSupplierDto) {
		return this.suppliersService.create(dto);
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.suppliersService.findOne(id);
	}

	@Patch(':id')
	update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
		return this.suppliersService.update(id, dto);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.suppliersService.remove(id);
	}
}
