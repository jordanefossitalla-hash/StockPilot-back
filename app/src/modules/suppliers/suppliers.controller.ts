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
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';
import { DateRangeQueryDto } from './dto/date-range-query.dto';
import { ListSupplierPaymentsQueryDto } from './dto/list-supplier-payments-query.dto';
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

	@Post(':id/payments')
	@ApiOperation({
		summary: 'Enregistrer un paiement fournisseur',
		description: 'Ajoute un versement fournisseur et met a jour le solde automatiquement.',
	})
	@ApiParam({ name: 'id', description: 'Identifiant UUID du fournisseur' })
	@ApiBody({
		type: CreateSupplierPaymentDto,
		examples: {
			default: {
				summary: 'Versement espece',
				value: {
					amount: 125000,
					paidAt: '2026-05-19T10:30:00.000Z',
					recordedBy: 'cashier-01',
				},
			},
		},
	})
	@ApiCreatedResponse({ description: 'Paiement fournisseur enregistre.' })
	@ApiBadRequestResponse({ description: 'Payload invalide.' })
	@ApiNotFoundResponse({ description: 'Fournisseur introuvable.' })
	createPayment(@Param('id') id: string, @Body() dto: CreateSupplierPaymentDto) {
		return this.suppliersService.createPayment(id, dto);
	}

	@Get(':id/payments')
	@ApiOperation({ summary: 'Lister les paiements d un fournisseur' })
	@ApiParam({ name: 'id', description: 'Identifiant UUID du fournisseur' })
	@ApiQuery({ name: 'from', required: false, example: '2026-05-01T00:00:00.000Z' })
	@ApiQuery({ name: 'to', required: false, example: '2026-05-31T23:59:59.999Z' })
	@ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
	@ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
	@ApiOkResponse({ description: 'Paiements fournisseur retournes.' })
	@ApiNotFoundResponse({ description: 'Fournisseur introuvable.' })
	listPayments(@Param('id') id: string, @Query() query: ListSupplierPaymentsQueryDto) {
		return this.suppliersService.listPayments(id, query);
	}

	@Get(':id/account')
	@ApiOperation({
		summary: 'Consulter le compte fournisseur',
		description:
			'Retourne les mouvements chronologiques (receptions et versements) avec soldes d ouverture, de cloture et courant.',
	})
	@ApiParam({ name: 'id', description: 'Identifiant UUID du fournisseur' })
	@ApiQuery({ name: 'from', required: false, example: '2026-05-01T00:00:00.000Z' })
	@ApiQuery({ name: 'to', required: false, example: '2026-05-31T23:59:59.999Z' })
	@ApiOkResponse({
		description: 'Compte fournisseur retourne.',
		example: {
			data: {
				openingBalance: -240000,
				closingBalance: -115000,
				currentBalance: -115000,
				movements: [
					{
						type: 'RECEPTION',
						amount: 300000,
						delta: -300000,
						occurredAt: '2026-05-05T08:30:00.000Z',
					},
					{
						type: 'PAYMENT',
						amount: 125000,
						delta: 125000,
						occurredAt: '2026-05-19T10:30:00.000Z',
					},
				],
			},
		},
	})
	@ApiNotFoundResponse({ description: 'Fournisseur introuvable.' })
	getAccount(@Param('id') id: string, @Query() query: DateRangeQueryDto) {
		return this.suppliersService.getAccount(id, query);
	}

	@Get(':id/report')
	@ApiOperation({
		summary: 'Generer un rapport fournisseur par periode',
		description:
			'Retourne les produits recus, montants commandes, paiements, variation de solde et commandes concernees.',
	})
	@ApiParam({ name: 'id', description: 'Identifiant UUID du fournisseur' })
	@ApiQuery({ name: 'from', required: false, example: '2026-05-01T00:00:00.000Z' })
	@ApiQuery({ name: 'to', required: false, example: '2026-05-31T23:59:59.999Z' })
	@ApiOkResponse({ description: 'Rapport fournisseur retourne.' })
	@ApiNotFoundResponse({ description: 'Fournisseur introuvable.' })
	getReport(@Param('id') id: string, @Query() query: DateRangeQueryDto) {
		return this.suppliersService.getReport(id, query);
	}
}
