import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiBody,
	ApiCreatedResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiTags,
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@ApiTags('Clients')
@Controller('clients')
export class ClientsController {
	constructor(private readonly clientsService: ClientsService) {}

	@Get()
	@ApiOperation({ summary: 'Lister les clients' })
	@ApiOkResponse({ description: 'Liste paginee des clients.' })
	@ApiBadRequestResponse({ description: 'Parametres de recherche invalides.' })
	findAll(@Query() query: ListClientsQueryDto) {
		return this.clientsService.findAll(query);
	}

	@Post()
	@ApiOperation({ summary: 'Creer un client' })
	@ApiBody({
		type: CreateClientDto,
		examples: {
			default: {
				summary: 'Client standard',
				value: {
					code: 'CLI-1204',
					name: 'Boutique Melen',
					phone: '+237699000111',
					email: 'contact@boutique-melen.cm',
					address: 'Yaounde, Melen',
					status: 'ACTIVE',
					balance: 0,
				},
			},
		},
	})
	@ApiCreatedResponse({ description: 'Client cree avec succes.' })
	@ApiBadRequestResponse({ description: 'Payload invalide.' })
	create(@Body() dto: CreateClientDto) {
		return this.clientsService.create(dto);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Recuperer un client' })
	@ApiParam({ name: 'id', description: 'Identifiant UUID du client' })
	@ApiOkResponse({ description: 'Detail du client.' })
	@ApiNotFoundResponse({ description: 'Client introuvable.' })
	findOne(@Param('id') id: string) {
		return this.clientsService.findOne(id);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Mettre a jour un client' })
	@ApiParam({ name: 'id', description: 'Identifiant UUID du client' })
	@ApiBody({
		type: UpdateClientDto,
		examples: {
			default: {
				summary: 'Maj contact client',
				value: {
					phone: '+237670001122',
					address: 'Yaounde, Bastos',
					status: 'WARNING',
				},
			},
		},
	})
	@ApiOkResponse({ description: 'Client mis a jour.' })
	@ApiBadRequestResponse({ description: 'Payload invalide.' })
	@ApiNotFoundResponse({ description: 'Client introuvable.' })
	update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
		return this.clientsService.update(id, dto);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Supprimer un client' })
	@ApiParam({ name: 'id', description: 'Identifiant UUID du client' })
	@ApiOkResponse({ description: 'Client supprime.' })
	@ApiNotFoundResponse({ description: 'Client introuvable.' })
	remove(@Param('id') id: string) {
		return this.clientsService.remove(id);
	}
}
