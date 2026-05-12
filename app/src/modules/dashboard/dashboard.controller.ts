import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
	constructor(private readonly dashboardService: DashboardService) {}

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
