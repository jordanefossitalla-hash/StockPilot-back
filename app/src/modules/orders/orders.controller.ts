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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { ReceiveOrderDto } from './dto/receive-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@ApiTags('Supplier Orders')
@Controller('orders')
export class OrdersController {
	constructor(private readonly ordersService: OrdersService) {}

	@Get()
	@ApiOperation({
		summary: 'Lister les commandes fournisseur',
		description: 'Retourne les commandes d approvisionnement avec pagination et filtres.',
	})
	@ApiOkResponse({ description: 'Liste paginee des commandes fournisseur.' })
	@ApiBadRequestResponse({ description: 'Parametres de filtre invalides.' })
	findAll(@Query() query: ListOrdersQueryDto) {
		return this.ordersService.findAll(query);
	}

	@Post()
	@ApiOperation({
		summary: 'Creer une commande fournisseur',
		description: 'Enregistre une commande d achat pour alimenter le stock.',
	})
	@ApiBody({
		type: CreateOrderDto,
		examples: {
			default: {
				summary: 'Commande standard',
				value: {
					supplierId: 'f03d4ac8-4c52-46ff-aabf-43869359d6d0',
					items: [
						{
							productId: 'caecf068-798f-4598-a624-e1e44c076552',
							quantity: 40,
							unitCost: 9800,
						},
					],
				},
			},
		},
	})
	@ApiCreatedResponse({ description: 'Commande fournisseur creee avec succes.' })
	@ApiBadRequestResponse({ description: 'Payload invalide.' })
	@ApiNotFoundResponse({ description: 'Un ou plusieurs produits sont introuvables.' })
	create(@Body() dto: CreateOrderDto) {
		return this.ordersService.create(dto);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Recuperer une commande fournisseur' })
	@ApiParam({ name: 'id', description: 'Identifiant UUID de la commande fournisseur.' })
	@ApiOkResponse({ description: 'Detail de la commande fournisseur.' })
	@ApiNotFoundResponse({ description: 'Commande fournisseur introuvable.' })
	findOne(@Param('id') id: string) {
		return this.ordersService.findOne(id);
	}

	@Patch(':id')
	@ApiOperation({
		summary: 'Mettre a jour le statut de commande fournisseur',
		description: 'Permet de modifier explicitement le statut de la commande.',
	})
	@ApiParam({ name: 'id', description: 'Identifiant UUID de la commande fournisseur.' })
	@ApiBody({
		type: UpdateOrderDto,
		examples: {
			cancelled: {
				summary: 'Passer en CANCELLED',
				value: { status: 'CANCELLED' },
			},
		},
	})
	@ApiOkResponse({ description: 'Commande fournisseur mise a jour.' })
	@ApiBadRequestResponse({ description: 'Payload invalide.' })
	@ApiNotFoundResponse({ description: 'Commande fournisseur introuvable.' })
	update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
		return this.ordersService.update(id, dto);
	}

	@Post(':id/receive')
	@ApiOperation({
		summary: 'Receptionner une commande fournisseur',
		description:
			'Recoit totalement ou partiellement une commande et incremente automatiquement le stock.',
	})
	@ApiParam({ name: 'id', description: 'Identifiant UUID de la commande fournisseur.' })
	@ApiBody({
		type: ReceiveOrderDto,
		examples: {
			partial: {
				summary: 'Reception partielle',
				value: {
					items: [
						{
							productId: 'caecf068-798f-4598-a624-e1e44c076552',
							quantity: 20,
						},
					],
				},
			},
		},
	})
	@ApiOkResponse({ description: 'Reception enregistree avec succes.' })
	@ApiBadRequestResponse({ description: 'Quantite invalide ou commande non recevable.' })
	@ApiNotFoundResponse({ description: 'Commande introuvable ou produit absent des lignes.' })
	receive(@Param('id') id: string, @Body() dto: ReceiveOrderDto) {
		return this.ordersService.receive(id, dto);
	}

	@Post(':id/cancel')
	@ApiOperation({ summary: 'Annuler une commande fournisseur' })
	@ApiParam({ name: 'id', description: 'Identifiant UUID de la commande fournisseur.' })
	@ApiOkResponse({ description: 'Commande fournisseur annulee.' })
	@ApiNotFoundResponse({ description: 'Commande fournisseur introuvable.' })
	cancel(@Param('id') id: string) {
		return this.ordersService.cancel(id);
	}
}
