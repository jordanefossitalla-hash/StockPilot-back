import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('clients')
export class ClientsController {
	constructor(private readonly clientsService: ClientsService) {}

	@Get()
	findAll(@Query() query: ListClientsQueryDto) {
		return this.clientsService.findAll(query);
	}

	@Post()
	create(@Body() dto: CreateClientDto) {
		return this.clientsService.create(dto);
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.clientsService.findOne(id);
	}

	@Patch(':id')
	update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
		return this.clientsService.update(id, dto);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.clientsService.remove(id);
	}
}
