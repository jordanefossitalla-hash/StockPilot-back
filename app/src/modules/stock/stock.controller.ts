import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiBody,
	ApiCreatedResponse,
	ApiOkResponse,
	ApiOperation,
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
	@ApiOkResponse({ description: 'Etat courant du stock retourne.' })
	getStatus(@Query() query: ListStockStatusQueryDto) {
		return this.stockService.getStatus(query);
	}

	@Get('history')
	@ApiOperation({ summary: 'Consulter l historique des mouvements de stock' })
	@ApiOkResponse({ description: 'Historique des mouvements retourne.' })
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
					productId: 'caecf068-798f-4598-a624-e1e44c076552',
					quantity: 30,
					unitCost: 9200,
					note: 'Reception lot mai 2026',
				},
			},
		},
	})
	@ApiCreatedResponse({ description: 'Entree de stock enregistree.' })
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
					note: 'Bouteilles cassees en rayon',
				},
			},
		},
	})
	@ApiCreatedResponse({ description: 'Sortie de stock enregistree.' })
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
					note: 'Ecart inventaire positif',
				},
			},
			negative: {
				summary: 'Ajustement negatif',
				value: {
					productId: 'caecf068-798f-4598-a624-e1e44c076552',
					quantityDelta: -3,
					note: 'Ecart inventaire negatif',
				},
			},
		},
	})
	@ApiCreatedResponse({ description: 'Ajustement de stock enregistre.' })
	@ApiBadRequestResponse({ description: 'Payload invalide.' })
	createAdjustment(@Body() dto: CreateStockAdjustmentDto) {
		return this.stockService.createAdjustment(dto);
	}
}
