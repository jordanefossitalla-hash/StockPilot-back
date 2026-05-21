import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiBody,
	ApiCreatedResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiTags,
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import {
	ClientAccountSortByDto,
	ClientAccountSortOrderDto,
	ClientAccountTypeDto,
	ListClientAccountStatusQueryDto,
} from './dto/list-client-account-status-query.dto';
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

	@Get('account-status')
	@ApiOperation({
		summary: 'Lister l etat de compte client',
		description:
			'Retourne les clients avec leur solde net actuel, en distinguant dette, avance ou compte solde. Par defaut, seuls les comptes non soldes sont renvoyes.',
	})
	@ApiQuery({
		name: 'search',
		required: false,
		example: 'melen',
		description: 'Recherche sur code, nom, telephone ou email.',
	})
	@ApiQuery({
		name: 'status',
		required: false,
		enum: ['ACTIVE', 'BLOCKED', 'WARNING'],
		description: 'Filtrer par statut client.',
	})
	@ApiQuery({
		name: 'accountType',
		required: false,
		enum: ClientAccountTypeDto,
		description: 'Filtrer les comptes par dette, avance ou solde nul.',
	})
	@ApiQuery({
		name: 'includeSettled',
		required: false,
		type: Boolean,
		description: 'Inclure aussi les comptes a zero quand accountType=ALL.',
	})
	@ApiQuery({
		name: 'minAmount',
		required: false,
		type: Number,
		example: 10000,
		description: 'Montant minimum absolu du solde net.',
	})
	@ApiQuery({
		name: 'sortBy',
		required: false,
		enum: ClientAccountSortByDto,
		description: 'Champ de tri.',
	})
	@ApiQuery({
		name: 'sortOrder',
		required: false,
		enum: ClientAccountSortOrderDto,
		description: 'Sens du tri.',
	})
	@ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
	@ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
	@ApiOkResponse({
		description: 'Etat de compte client retourne avec dettes et avances.',
		example: {
			data: [
				{
					clientId: '8d0d1a8b-1f3f-4adb-8e8d-2b6768d267ef',
					code: 'CLI-0012',
					name: 'Boutique Melen',
					phone: '+237699000111',
					email: 'contact@boutique-melen.cm',
					status: 'ACTIVE',
					netBalance: -65000,
					currentDebt: 65000,
					currentAdvance: 0,
					accountType: 'DEBT',
					salesCount: 8,
					totalPurchased: 245000,
					totalPaid: 180000,
					outstandingSalesDebt: 65000,
					lastSaleAt: '2026-05-20T10:14:00.000Z',
					lastPaymentAt: '2026-05-21T08:30:00.000Z',
				},
				{
					clientId: '51563ab4-6bfc-49b3-b0bc-78aedb7f6388',
					code: 'CLI-0041',
					name: 'Pharmacie du Centre',
					phone: '+237677334455',
					email: null,
					status: 'ACTIVE',
					netBalance: 12000,
					currentDebt: 0,
					currentAdvance: 12000,
					accountType: 'ADVANCE',
					salesCount: 2,
					totalPurchased: 30000,
					totalPaid: 18000,
					outstandingSalesDebt: 12000,
					lastSaleAt: '2026-05-18T15:00:00.000Z',
					lastPaymentAt: '2026-05-18T15:00:00.000Z',
				},
			],
			meta: {
				page: 1,
				limit: 20,
				total: 2,
			},
		},
	})
	@ApiBadRequestResponse({ description: 'Parametres de recherche invalides.' })
	findAccountStatus(@Query() query: ListClientAccountStatusQueryDto) {
		return this.clientsService.listAccountStatus(query);
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
