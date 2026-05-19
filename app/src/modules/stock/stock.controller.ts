import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiBody,
	ApiCreatedResponse,
	ApiOkResponse,
	ApiOperation,
	ApiQuery,
	ApiTags,
} from '@nestjs/swagger';
import { StockService } from './stock.service';
import { ListStockStatusQueryDto } from './dto/list-stock-status-query.dto';
import { ListStockHistoryQueryDto } from './dto/list-stock-history-query.dto';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';
import { CreateStockExitDto } from './dto/create-stock-exit.dto';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';

@ApiTags('Stock')
@Controller('stock')
export class StockController {
	constructor(private readonly stockService: StockService) {}

	@Get('status')
	@ApiOperation({ summary: 'Consulter l etat du stock' })
	@ApiQuery({ name: 'search', required: false, example: 'PRD-001' })
	@ApiQuery({
		name: 'stockLevel',
		required: false,
		enum: ['ALL', 'OUT', 'LOW', 'AVAILABLE'],
		description: 'Filtre par niveau de stock.',
	})
	@ApiQuery({
		name: 'lowStockOnly',
		required: false,
		type: Boolean,
		description: 'Filtre legacy: true pour stock faible/rupture.',
	})
	@ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
	@ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
	@ApiOkResponse({
		description: 'Etat courant du stock retourne.',
		example: {
			data: [
				{
					id: 'caecf068-798f-4598-a624-e1e44c076552',
					sku: 'PRD-001',
					name: 'POS Terminal T20',
					stockQuantity: 14,
					stockMinThreshold: 5,
					status: 'ACTIVE',
					updatedAt: '2026-05-08T09:00:00.000Z',
					categoryName: 'Informatique',
				},
			],
			meta: { page: 1, limit: 20, total: 1 },
		},
	})
	getStatus(@Query() query: ListStockStatusQueryDto) {
		return this.stockService.getStatus(query);
	}

	@Get('history')
	@ApiOperation({ summary: 'Consulter l historique des mouvements de stock' })
	@ApiQuery({ name: 'productId', required: false, example: 'caecf068-798f-4598-a624-e1e44c076552' })
	@ApiQuery({
		name: 'type',
		required: false,
		enum: ['ENTRY', 'EXIT', 'ADJUSTMENT', 'SALE', 'ORDER_RECEIVE'],
	})
	@ApiQuery({ name: 'search', required: false, example: 'FAC-9007' })
	@ApiQuery({ name: 'from', required: false, example: '2026-05-01T00:00:00.000Z' })
	@ApiQuery({ name: 'to', required: false, example: '2026-05-31T23:59:59.999Z' })
	@ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
	@ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
	@ApiOkResponse({
		description: 'Historique des mouvements retourne.',
		example: {
			data: [
				{
					id: 'f82a2939-ed2e-4348-ba5b-a3e859b141e9',
					productId: 'caecf068-798f-4598-a624-e1e44c076552',
					type: 'ENTRY',
					quantity: 6,
					unitCost: 9200,
					referenceType: 'manual',
					referenceId: 'BON-4421',
					note: 'Reapprovisionnement fournisseur',
					createdAt: '2026-05-08T09:00:00.000Z',
					product: {
						id: 'caecf068-798f-4598-a624-e1e44c076552',
						sku: 'PRD-001',
						name: 'POS Terminal T20',
						category: { id: '18d67a5a-86f7-4d2d-a6f4-f83adf5f7fcf', name: 'Informatique' },
					},
				},
			],
			meta: { page: 1, limit: 20, total: 1 },
		},
	})
	getHistory(@Query() query: ListStockHistoryQueryDto) {
		return this.stockService.getHistory(query);
	}

	@Post('entries')
	@ApiOperation({
		summary: 'Ajouter une entree de stock',
		description: 'Incremente le stock d un produit (approvisionnement, retour, correction).',
	})
	@ApiBody({
		type: CreateStockEntryDto,
		examples: {
			default: {
				summary: 'Entree suite approvisionnement',
				value: {
					supplierId: 'f03d4ac8-4c52-46ff-aabf-43869359d6d0',
					productId: 'caecf068-798f-4598-a624-e1e44c076552',
					quantity: 30,
					unitCost: 9200,
					reference: 'BON-4455',
					note: 'Reception lot mai 2026',
				},
			},
		},
	})
	@ApiCreatedResponse({
		description: 'Entree de stock enregistree.',
		example: {
			data: {
				movement: {
					type: 'ENTRY',
					quantity: 30,
					referenceId: 'f03d4ac8-4c52-46ff-aabf-43869359d6d0',
					note: 'Reception lot mai 2026',
				},
				product: {
					id: 'caecf068-798f-4598-a624-e1e44c076552',
					stockQuantity: 44,
				},
			},
		},
	})
	@ApiBadRequestResponse({ description: 'Payload invalide.' })
	createEntry(@Body() dto: CreateStockEntryDto) {
		return this.stockService.createEntry(dto);
	}

	@Post('exits')
	@ApiOperation({
		summary: 'Ajouter une sortie de stock',
		description: 'Decremente le stock d un produit (perte, casse, consommation interne).',
	})
	@ApiBody({
		type: CreateStockExitDto,
		examples: {
			default: {
				summary: 'Sortie pour casse',
				value: {
					productId: 'caecf068-798f-4598-a624-e1e44c076552',
					quantity: 2,
					reference: 'FAC-9020',
					note: 'Bouteilles cassees en rayon',
				},
			},
		},
	})
	@ApiCreatedResponse({
		description: 'Sortie de stock enregistree.',
		example: {
			data: {
				movement: {
					type: 'EXIT',
					quantity: 2,
					referenceId: 'FAC-9020',
					note: 'Bouteilles cassees en rayon',
				},
				product: {
					id: 'caecf068-798f-4598-a624-e1e44c076552',
					stockQuantity: 12,
				},
			},
		},
	})
	@ApiBadRequestResponse({ description: 'Payload invalide ou stock insuffisant.' })
	createExit(@Body() dto: CreateStockExitDto) {
		return this.stockService.createExit(dto);
	}

	@Post('adjustments')
	@ApiOperation({
		summary: 'Ajuster le stock',
		description: 'Applique un delta positif ou negatif apres inventaire.',
	})
	@ApiBody({
		type: CreateStockAdjustmentDto,
		examples: {
			positive: {
				summary: 'Ajustement positif',
				value: {
					productId: 'caecf068-798f-4598-a624-e1e44c076552',
					quantityDelta: 5,
					reference: 'INV-112',
					note: 'Ecart inventaire positif',
				},
			},
			negative: {
				summary: 'Ajustement negatif',
				value: {
					productId: 'caecf068-798f-4598-a624-e1e44c076552',
					quantityDelta: -3,
					reference: 'INV-112',
					note: 'Ecart inventaire negatif',
				},
			},
		},
	})
	@ApiCreatedResponse({
		description: 'Ajustement de stock enregistre.',
		example: {
			data: {
				movement: {
					type: 'ADJUSTMENT',
					quantity: -3,
					referenceId: 'INV-112',
					note: 'Ecart inventaire negatif',
				},
				product: {
					id: 'caecf068-798f-4598-a624-e1e44c076552',
					stockQuantity: 9,
				},
			},
		},
	})
	@ApiBadRequestResponse({ description: 'Payload invalide.' })
	createAdjustment(@Body() dto: CreateStockAdjustmentDto) {
		return this.stockService.createAdjustment(dto);
	}
}
