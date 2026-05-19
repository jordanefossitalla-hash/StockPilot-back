import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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
import { SalesService } from './sales.service';
import { CreateSalePaymentDto } from './dto/create-sale-payment.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ListSalesQueryDto } from './dto/list-sales-query.dto';

@ApiTags('Sales')
@Controller('sales')
export class SalesController {
	constructor(private readonly salesService: SalesService) {}

	@Get()
	@ApiOperation({ summary: 'Lister les ventes' })
	@ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'CONFIRMED', 'PARTIAL', 'PAID', 'CANCELLED'] })
	@ApiQuery({ name: 'clientId', required: false, example: '8f1fce75-6bcc-4fba-a95c-b3a300e265fd' })
	@ApiQuery({ name: 'search', required: false, example: 'POS Terminal' })
	@ApiQuery({ name: 'from', required: false, example: '2026-05-01T00:00:00.000Z' })
	@ApiQuery({ name: 'to', required: false, example: '2026-05-31T23:59:59.999Z' })
	@ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
	@ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
	@ApiOkResponse({
		description: 'Liste paginee des ventes.',
		example: {
			data: [
				{
					id: 'e5cf9ee4-69fb-4ad5-a245-ea4488805cb8',
					code: 'SAL-20260518101530-247',
					status: 'PARTIAL',
					total: '29000',
					paidAmount: '5000',
					remainingAmount: '24000',
					soldAt: '2026-05-18T10:15:30.000Z',
					client: {
						id: '8f1fce75-6bcc-4fba-a95c-b3a300e265fd',
						code: 'CL-001',
						name: 'Awa Traore',
						phone: '+2250700000000',
					},
					items: [
						{
							id: '42c2f513-5f92-4bd4-8125-f90ea8765275',
							quantity: 1,
							unitPrice: '29000',
							lineTotal: '29000',
							product: {
								id: 'caecf068-798f-4598-a624-e1e44c076552',
								sku: 'PRD-001',
								name: 'POS Terminal T20',
							},
						},
					],
					_count: {
						payments: 1,
					},
				},
			],
			meta: {
				page: 1,
				limit: 20,
				total: 1,
			},
		},
	})
	findAll(@Query() query: ListSalesQueryDto) {
		return this.salesService.findAll(query);
	}

	@Post()
	@ApiOperation({
		summary: 'Creer une vente',
		description:
			'Si clientOrderId est renseigne, la commande client liee passe automatiquement en DELIVERED.',
	})
	@ApiBody({
		type: CreateSaleDto,
		examples: {
			linkedClientOrder: {
				summary: 'Vente liee a une commande client',
				value: {
					clientId: '8f1fce75-6bcc-4fba-a95c-b3a300e265fd',
					clientOrderId: 'a6e51893-e2b2-47f7-bd5d-f8daf452758c',
					items: [
						{
							productId: 'caecf068-798f-4598-a624-e1e44c076552',
							quantity: 2,
							unitPrice: 14500,
						},
					],
					paidAmount: 5000,
					note: 'Commande client livree via cette vente.',
				},
			},
		},
	})
	@ApiCreatedResponse({ description: 'Vente creee avec succes.' })
	@ApiBadRequestResponse({
		description:
			'Payload invalide, stock insuffisant, ou une autre vente active est deja liee a cette commande client.',
	})
	@ApiNotFoundResponse({ description: 'Produit ou commande client introuvable.' })
	create(@Body() dto: CreateSaleDto) {
		return this.salesService.create(dto);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Recuperer une vente' })
	@ApiParam({ name: 'id', description: 'Identifiant UUID de la vente.' })
	@ApiOkResponse({ description: 'Detail de la vente.' })
	@ApiNotFoundResponse({ description: 'Vente introuvable.' })
	findOne(@Param('id') id: string) {
		return this.salesService.findOne(id);
	}

	@Post(':id/payments')
	@ApiOperation({
		summary: 'Ajouter un paiement sur une vente',
		description: 'Met a jour paidAmount, remainingAmount et statut de la vente.',
	})
	@ApiParam({ name: 'id', description: 'Identifiant UUID de la vente.' })
	@ApiBody({
		type: CreateSalePaymentDto,
		examples: {
			cash: {
				summary: 'Paiement espece',
				value: {
					amount: 5000,
					method: 'cash',
					recordedBy: 'cashier-01',
				},
			},
			mobileMoney: {
				summary: 'Paiement mobile money',
				value: {
					amount: 14500,
					method: 'momo',
				},
			},
		},
	})
	@ApiCreatedResponse({ description: 'Paiement enregistre sur la vente.' })
	@ApiBadRequestResponse({ description: 'Paiement invalide ou vente annulee.' })
	@ApiNotFoundResponse({ description: 'Vente introuvable.' })
	addPayment(@Param('id') id: string, @Body() dto: CreateSalePaymentDto) {
		return this.salesService.addPayment(id, dto);
	}

	@Post(':id/cancel')
	@ApiOperation({
		summary: 'Annuler une vente',
		description:
			'Remet les quantites en stock et, si une commande client etait liee, la repasse en TO_DELIVER.',
	})
	@ApiParam({ name: 'id', description: 'Identifiant UUID de la vente.' })
	@ApiOkResponse({ description: 'Vente annulee avec succes.' })
	@ApiNotFoundResponse({ description: 'Vente introuvable.' })
	cancel(@Param('id') id: string) {
		return this.salesService.cancel(id);
	}
}
