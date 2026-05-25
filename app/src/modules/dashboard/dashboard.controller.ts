import { Controller, Get, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardGroupByDto, DashboardOverviewQueryDto } from './dto/dashboard-overview-query.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
	constructor(private readonly dashboardService: DashboardService) {}

	@Get('overview')
	@ApiOperation({
		summary: 'Recuperer la vue consolidee du dashboard',
		description:
			'Retourne les KPI principaux, les graphiques d evolution et les tops utiles pour charger le tableau de bord en un seul appel.',
	})
	@ApiQuery({ name: 'from', required: false, example: '2026-05-01T00:00:00.000Z' })
	@ApiQuery({ name: 'to', required: false, example: '2026-05-31T23:59:59.999Z' })
	@ApiQuery({ name: 'groupBy', required: false, enum: DashboardGroupByDto })
	@ApiOkResponse({
		description: 'Vue consolidee du dashboard retournee.',
		example: {
			data: {
				period: {
					from: '2026-05-01T00:00:00.000Z',
					to: '2026-05-31T23:59:59.999Z',
					groupBy: 'DAY',
				},
				kpis: {
					totalRevenue: 357850,
					collectedRevenue: 180000,
					outstandingRevenue: 177850,
					grossProfit: 24600,
					marginRate: 6.87,
					salesCount: 9,
					activeClientsCount: 24,
					newClientsCount: 4,
					productsOutOfStock: 3,
					productsLowStock: 7,
					ordersPendingReception: 5,
					clientOrdersToDeliver: 6,
				},
				charts: {
					revenueEvolution: [{ period: '2026-05-19', value: 336250 }],
					profitEvolution: [{ period: '2026-05-19', value: 22800 }],
					collectionsEvolution: [{ period: '2026-05-19', value: 180000 }],
					clientsEvolution: [{ period: '2026-05-19', value: 2 }],
					salesByStatus: [{ label: 'PAID', value: 4 }],
					stockHealthDistribution: [{ label: 'LOW_STOCK', value: 7 }],
				},
				tops: {
					topClients: [{ clientId: 'uuid', code: 'CLI-001', name: 'moussa souley', salesCount: 3, revenue: 96000, paidAmount: 44000, profit: 6200 }],
					topDebtors: [{ clientId: 'uuid', code: 'CLI-010', name: 'Boutique Mboa', phone: '+2376...', currentDebt: 59000 }],
				},
			},
		},
	})
	@ApiBadRequestResponse({ description: 'Parametres de periode invalides.' })
	getOverview(@Query() query: DashboardOverviewQueryDto) {
		return this.dashboardService.getOverview(query);
	}

	@Get('metrics')
	getMetrics() {
		return this.dashboardService.getMetrics();
	}

	@Get('monthly-performance')
	getMonthlyPerformance() {
		return this.dashboardService.getMonthlyPerformance();
	}

	@Get('operations-evolution')
	getOperationsEvolution() {
		return this.dashboardService.getOperationsEvolution();
	}

	@Get('stock-distribution')
	getStockDistribution() {
		return this.dashboardService.getStockDistribution();
	}

	@Get('top-products')
	getTopProducts() {
		return this.dashboardService.getTopProducts();
	}
}
