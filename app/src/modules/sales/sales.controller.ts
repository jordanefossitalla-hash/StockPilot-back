import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
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
import { SalesService } from './sales.service';
import { CreateSalePaymentDto } from './dto/create-sale-payment.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ListSalesQueryDto } from './dto/list-sales-query.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

@ApiTags('Sales')
@Controller('sales')
export class SalesController {
	constructor(private readonly salesService: SalesService) {}

	@Get()
	@ApiOperation({ summary: 'Lister les ventes' })
	@ApiOkResponse({ description: 'Liste paginee des ventes.' })
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

	@Patch(':id')
	@ApiOperation({ summary: 'Mettre a jour le statut de vente' })
	@ApiParam({ name: 'id', description: 'Identifiant UUID de la vente.' })
	@ApiBody({
		type: UpdateSaleDto,
		examples: {
			markPaid: {
				summary: 'Passer une vente en PAID',
				value: {
					status: 'PAID',
				},
			},
		},
	})
	@ApiOkResponse({ description: 'Vente mise a jour.' })
	@ApiBadRequestResponse({ description: 'Payload invalide.' })
	@ApiNotFoundResponse({ description: 'Vente introuvable.' })
	update(@Param('id') id: string, @Body() dto: UpdateSaleDto) {
		return this.salesService.update(id, dto);
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
