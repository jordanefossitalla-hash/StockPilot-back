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
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { ListSuppliersQueryDto } from './dto/list-suppliers-query.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@ApiTags('Suppliers')
@Controller('suppliers')
export class SuppliersController {
	constructor(private readonly suppliersService: SuppliersService) {}

	@Get()
	@ApiOperation({ summary: 'Lister les fournisseurs' })
	@ApiOkResponse({ description: 'Liste paginee des fournisseurs.' })
	@ApiBadRequestResponse({ description: 'Parametres de recherche invalides.' })
	findAll(@Query() query: ListSuppliersQueryDto) {
		return this.suppliersService.findAll(query);
	}

	@Post()
	@ApiOperation({ summary: 'Creer un fournisseur' })
	@ApiBody({
		type: CreateSupplierDto,
		examples: {
			default: {
				summary: 'Fournisseur principal',
				value: {
					code: 'SUP-0042',
					name: 'Global Distribution SARL',
					phone: '+237699112233',
					email: 'contact@global-distribution.cm',
					address: 'Douala, Akwa',
					status: 'ACTIVE',
					balance: 50000,
				},
			},
		},
	})
	@ApiCreatedResponse({ description: 'Fournisseur cree avec succes.' })
	@ApiBadRequestResponse({ description: 'Payload invalide.' })
	create(@Body() dto: CreateSupplierDto) {
		return this.suppliersService.create(dto);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Recuperer un fournisseur' })
	@ApiParam({ name: 'id', description: 'Identifiant UUID du fournisseur' })
	@ApiOkResponse({ description: 'Detail du fournisseur.' })
	@ApiNotFoundResponse({ description: 'Fournisseur introuvable.' })
	findOne(@Param('id') id: string) {
		return this.suppliersService.findOne(id);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Mettre a jour un fournisseur' })
	@ApiParam({ name: 'id', description: 'Identifiant UUID du fournisseur' })
	@ApiBody({
		type: UpdateSupplierDto,
		examples: {
			default: {
				summary: 'Maj statut et contact',
				value: {
					phone: '+237677889900',
					status: 'WARNING',
				},
			},
		},
	})
	@ApiOkResponse({ description: 'Fournisseur mis a jour.' })
	@ApiBadRequestResponse({ description: 'Payload invalide.' })
	@ApiNotFoundResponse({ description: 'Fournisseur introuvable.' })
	update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
		return this.suppliersService.update(id, dto);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Supprimer un fournisseur' })
	@ApiParam({ name: 'id', description: 'Identifiant UUID du fournisseur' })
	@ApiOkResponse({ description: 'Fournisseur supprime.' })
	@ApiNotFoundResponse({ description: 'Fournisseur introuvable.' })
	remove(@Param('id') id: string) {
		return this.suppliersService.remove(id);
	}
}
