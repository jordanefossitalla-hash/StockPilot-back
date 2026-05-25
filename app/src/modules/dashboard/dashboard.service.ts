import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
	DashboardGroupByDto,
	DashboardOverviewQueryDto,
} from './dto/dashboard-overview-query.dto';

@Injectable()
export class DashboardService {
	constructor(private readonly prisma: PrismaService) {}

	private toNumber(value: Prisma.Decimal | number | string | null | undefined): number {
		if (value === null || value === undefined) {
			return 0;
		}
		if (typeof value === 'number') {
			return value;
		}
		if (typeof value === 'string') {
			return Number(value);
		}
		return value.toNumber();
	}

	private buildDateRange(from?: string, to?: string) {
		return from || to
			? {
				gte: from ? new Date(from) : undefined,
				lte: to ? new Date(to) : undefined,
			}
			: undefined;
	}

	private getGroupingConfig(groupBy: DashboardGroupByDto) {
		if (groupBy === DashboardGroupByDto.MONTH) {
			return { unit: 'month', format: 'YYYY-MM' };
		}

		if (groupBy === DashboardGroupByDto.WEEK) {
			return { unit: 'week', format: 'YYYY-MM-DD' };
		}

		return { unit: 'day', format: 'YYYY-MM-DD' };
	}

	async getMetrics() {
		const [products, clients, suppliers, salesCount, ordersCount, salesTotals] =
			await Promise.all([
				this.prisma.product.count(),
				this.prisma.client.count(),
				this.prisma.supplier.count(),
				this.prisma.sale.count({
					where: {
						status: {
							not: 'CANCELLED',
						},
					},
				}),
				this.prisma.order.count(),
				this.prisma.sale.aggregate({
					where: {
						status: {
							not: 'CANCELLED',
						},
					},
					_sum: { total: true, paidAmount: true, remainingAmount: true },
				}),
			]);

		return {
			data: {
				products,
				clients,
				suppliers,
				salesCount,
				ordersCount,
				totalRevenue: Number(salesTotals._sum.total ?? 0),
				totalPaid: Number(salesTotals._sum.paidAmount ?? 0),
				totalOutstanding: Number(salesTotals._sum.remainingAmount ?? 0),
			},
		};
	}

	async getMonthlyPerformance() {
		const rows = await this.prisma.$queryRaw<
			Array<{ month: string; sales_total: number; orders_total: number }>
		>(Prisma.sql`
			WITH months AS (
				SELECT to_char(date_trunc('month', NOW()) - (interval '1 month' * g), 'YYYY-MM') AS month
				FROM generate_series(5, 0, -1) AS g
			),
			sales_agg AS (
				SELECT to_char(date_trunc('month', s."soldAt"), 'YYYY-MM') AS month, COALESCE(SUM(s."total"), 0) AS total
				FROM "Sale" s
				GROUP BY 1
			),
			orders_agg AS (
				SELECT to_char(date_trunc('month', o."orderedAt"), 'YYYY-MM') AS month, COALESCE(SUM(o."total"), 0) AS total
				FROM "Order" o
				GROUP BY 1
			)
			SELECT m.month,
						 COALESCE(sa.total, 0)::float8 AS sales_total,
						 COALESCE(oa.total, 0)::float8 AS orders_total
			FROM months m
			LEFT JOIN sales_agg sa ON sa.month = m.month
			LEFT JOIN orders_agg oa ON oa.month = m.month
			ORDER BY m.month ASC
		`);

		return { data: rows };
	}

	async getOperationsEvolution() {
		const rows = await this.prisma.$queryRaw<
			Array<{ day: string; entries: number; exits: number; adjustments: number }>
		>(Prisma.sql`
			SELECT to_char(date_trunc('day', sm."createdAt"), 'YYYY-MM-DD') AS day,
						 SUM(CASE WHEN sm."type" IN ('ENTRY', 'ORDER_RECEIVE') THEN sm."quantity" ELSE 0 END)::int AS entries,
						 SUM(CASE WHEN sm."type" IN ('EXIT', 'SALE') THEN sm."quantity" ELSE 0 END)::int AS exits,
						 SUM(CASE WHEN sm."type" = 'ADJUSTMENT' THEN sm."quantity" ELSE 0 END)::int AS adjustments
			FROM "StockMovement" sm
			WHERE sm."createdAt" >= NOW() - interval '30 days'
			GROUP BY 1
			ORDER BY 1 ASC
		`);

		return { data: rows };
	}

	async getStockDistribution() {
		const rows = await this.prisma.$queryRaw<
			Array<{ segment: string; count: number }>
		>(Prisma.sql`
			SELECT 'out_of_stock' AS segment, COUNT(*)::int AS count
			FROM "Product"
			WHERE "stockQuantity" = 0
			UNION ALL
			SELECT 'low_stock' AS segment, COUNT(*)::int AS count
			FROM "Product"
			WHERE "stockQuantity" > 0 AND "stockQuantity" <= "stockMinThreshold"
			UNION ALL
			SELECT 'healthy' AS segment, COUNT(*)::int AS count
			FROM "Product"
			WHERE "stockQuantity" > "stockMinThreshold"
		`);

		return { data: rows };
	}

	async getTopProducts() {
		const grouped = await this.prisma.saleItem.groupBy({
			by: ['productId'],
			_sum: { quantity: true, lineTotal: true },
			orderBy: { _sum: { quantity: 'desc' } },
			take: 5,
		});

		const productIds = grouped.map((row) => row.productId);
		const products = await this.prisma.product.findMany({
			where: { id: { in: productIds } },
			select: { id: true, sku: true, name: true },
		});
		const productMap = new Map(products.map((p) => [p.id, p]));

		return {
			data: grouped.map((row) => ({
				productId: row.productId,
				sku: productMap.get(row.productId)?.sku ?? '',
				name: productMap.get(row.productId)?.name ?? '',
				quantitySold: row._sum.quantity ?? 0,
				revenue: Number(row._sum.lineTotal ?? 0),
			})),
		};
	}

	async getOverview(query: DashboardOverviewQueryDto) {
		const saleDateRange = this.buildDateRange(query.from, query.to);
		const clientDateRange = this.buildDateRange(query.from, query.to);
		const grouping = this.getGroupingConfig(query.groupBy ?? DashboardGroupByDto.DAY);
		const saleWhere: Prisma.SaleWhereInput = {
			status: { not: 'CANCELLED' },
			soldAt: saleDateRange,
		};

		const [
			salesTotals,
			activeClientsCount,
			newClientsCount,
			productsOutOfStock,
			productsLowStock,
			ordersPendingReception,
			clientOrdersToDeliver,
			salesByStatus,
			stockDistribution,
			revenueEvolution,
			clientsEvolution,
			topProducts,
			topClients,
			topDebtors,
		] = await Promise.all([
			this.prisma.sale.aggregate({
				where: saleWhere,
				_sum: {
					total: true,
					paidAmount: true,
					remainingAmount: true,
					profitTotal: true,
				},
				_count: { _all: true },
			}),
			this.prisma.client.count({ where: { status: 'ACTIVE' } }),
			this.prisma.client.count({ where: { createdAt: clientDateRange } }),
			this.prisma.product.count({ where: { stockQuantity: 0 } }),
			this.prisma.product.count({
				where: {
					stockQuantity: { gt: 0 },
					NOT: { stockMinThreshold: 0 },
					AND: [{ stockQuantity: { lte: this.prisma.product.fields.stockMinThreshold } as never }],
				},
			}).catch(async () =>
				this.prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
					SELECT COUNT(*)::int AS count
					FROM "Product"
					WHERE "stockQuantity" > 0 AND "stockQuantity" <= "stockMinThreshold"
				`).then((rows) => rows[0]?.count ?? 0),
			),
			this.prisma.order.count({
				where: {
					status: { in: ['ORDERED', 'PARTIAL_RECEIVED'] },
				},
			}),
			this.prisma.clientOrder.count({
				where: { deliveryStatus: 'TO_DELIVER' },
			}),
			this.prisma.sale.groupBy({
				by: ['status'],
				where: { soldAt: saleDateRange },
				_count: { _all: true },
			}),
			this.prisma.$queryRaw<Array<{ label: string; value: number }>>(Prisma.sql`
				SELECT 'OUT_OF_STOCK' AS label, COUNT(*)::int AS value
				FROM "Product"
				WHERE "stockQuantity" = 0
				UNION ALL
				SELECT 'LOW_STOCK' AS label, COUNT(*)::int AS value
				FROM "Product"
				WHERE "stockQuantity" > 0 AND "stockQuantity" <= "stockMinThreshold"
				UNION ALL
				SELECT 'HEALTHY' AS label, COUNT(*)::int AS value
				FROM "Product"
				WHERE "stockQuantity" > "stockMinThreshold"
			`),
			this.prisma.$queryRaw<
				Array<{ period: string; revenue: number; profit: number; collected: number }>
			>(Prisma.sql`
				SELECT
					to_char(date_trunc(${Prisma.raw(`'${grouping.unit}'`)}, s."soldAt"), ${Prisma.raw(`'${grouping.format}'`)}) AS period,
					COALESCE(SUM(s."total"), 0)::float8 AS revenue,
					COALESCE(SUM(s."profitTotal"), 0)::float8 AS profit,
					COALESCE(SUM(s."paidAmount"), 0)::float8 AS collected
				FROM "Sale" s
				WHERE s."status" <> 'CANCELLED'
					AND (${query.from ?? null} IS NULL OR s."soldAt" >= ${query.from ? new Date(query.from) : null})
					AND (${query.to ?? null} IS NULL OR s."soldAt" <= ${query.to ? new Date(query.to) : null})
				GROUP BY 1
				ORDER BY 1 ASC
			`),
			this.prisma.$queryRaw<Array<{ period: string; value: number }>>(Prisma.sql`
				SELECT
					to_char(date_trunc(${Prisma.raw(`'${grouping.unit}'`)}, c."createdAt"), ${Prisma.raw(`'${grouping.format}'`)}) AS period,
					COUNT(*)::int AS value
				FROM "Client" c
				WHERE (${query.from ?? null} IS NULL OR c."createdAt" >= ${query.from ? new Date(query.from) : null})
					AND (${query.to ?? null} IS NULL OR c."createdAt" <= ${query.to ? new Date(query.to) : null})
				GROUP BY 1
				ORDER BY 1 ASC
			`),
			this.prisma.$queryRaw<
				Array<{ productId: string; sku: string; name: string; quantitySold: number; revenue: number; profit: number }>
			>(Prisma.sql`
				SELECT
					si."productId",
					p."sku",
					p."name",
					COALESCE(SUM(si."quantity"), 0)::int AS "quantitySold",
					COALESCE(SUM(si."lineTotal"), 0)::float8 AS revenue,
					COALESCE(SUM(si."lineProfit"), 0)::float8 AS profit
				FROM "SaleItem" si
				INNER JOIN "Sale" s ON s."id" = si."saleId"
				INNER JOIN "Product" p ON p."id" = si."productId"
				WHERE s."status" <> 'CANCELLED'
					AND (${query.from ?? null} IS NULL OR s."soldAt" >= ${query.from ? new Date(query.from) : null})
					AND (${query.to ?? null} IS NULL OR s."soldAt" <= ${query.to ? new Date(query.to) : null})
				GROUP BY si."productId", p."sku", p."name"
				ORDER BY revenue DESC
				LIMIT 5
			`),
			this.prisma.$queryRaw<
				Array<{ clientId: string; code: string; name: string; revenue: number; paidAmount: number; profit: number; salesCount: number }>
			>(Prisma.sql`
				SELECT
					c."id" AS "clientId",
					c."code",
					c."name",
					COALESCE(SUM(s."total"), 0)::float8 AS revenue,
					COALESCE(SUM(s."paidAmount"), 0)::float8 AS "paidAmount",
					COALESCE(SUM(s."profitTotal"), 0)::float8 AS profit,
					COUNT(*)::int AS "salesCount"
				FROM "Sale" s
				INNER JOIN "Client" c ON c."id" = s."clientId"
				WHERE s."status" <> 'CANCELLED'
					AND (${query.from ?? null} IS NULL OR s."soldAt" >= ${query.from ? new Date(query.from) : null})
					AND (${query.to ?? null} IS NULL OR s."soldAt" <= ${query.to ? new Date(query.to) : null})
				GROUP BY c."id", c."code", c."name"
				ORDER BY revenue DESC
				LIMIT 5
			`),
			this.prisma.client.findMany({
				where: { balance: { lt: 0 } },
				select: {
					id: true,
					code: true,
					name: true,
					phone: true,
					balance: true,
				},
				orderBy: { balance: 'asc' },
				take: 5,
			}),
		]);

		const grossRevenue = this.toNumber(salesTotals._sum.total);
		const grossProfit = this.toNumber(salesTotals._sum.profitTotal);
		const collectedRevenue = this.toNumber(salesTotals._sum.paidAmount);
		const outstandingRevenue = this.toNumber(salesTotals._sum.remainingAmount);
		const salesCount = salesTotals._count._all;
		const marginRate = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;

		return {
			data: {
				period: {
					from: query.from ?? null,
					to: query.to ?? null,
					groupBy: query.groupBy ?? DashboardGroupByDto.DAY,
				},
				kpis: {
					totalRevenue: grossRevenue,
					collectedRevenue,
					outstandingRevenue,
					grossProfit,
					marginRate,
					salesCount,
					activeClientsCount,
					newClientsCount,
					productsOutOfStock,
					productsLowStock: Number(productsLowStock),
					ordersPendingReception,
					clientOrdersToDeliver,
				},
				charts: {
					revenueEvolution: revenueEvolution.map((row) => ({ period: row.period, value: Number(row.revenue) })),
					profitEvolution: revenueEvolution.map((row) => ({ period: row.period, value: Number(row.profit) })),
					collectionsEvolution: revenueEvolution.map((row) => ({ period: row.period, value: Number(row.collected) })),
					clientsEvolution: clientsEvolution.map((row) => ({ period: row.period, value: Number(row.value) })),
					salesByStatus: salesByStatus.map((row) => ({ label: row.status, value: row._count._all })),
					stockHealthDistribution: stockDistribution.map((row) => ({ label: row.label, value: Number(row.value) })),
				},
				tops: {
					topProducts: topProducts.map((row) => ({
						productId: row.productId,
						sku: row.sku,
						name: row.name,
						quantitySold: Number(row.quantitySold),
						revenue: Number(row.revenue),
						profit: Number(row.profit),
					})),
					topClients: topClients.map((row) => ({
						clientId: row.clientId,
						code: row.code,
						name: row.name,
						salesCount: Number(row.salesCount),
						revenue: Number(row.revenue),
						paidAmount: Number(row.paidAmount),
						profit: Number(row.profit),
					})),
					topDebtors: topDebtors.map((client) => ({
						clientId: client.id,
						code: client.code,
						name: client.name,
						phone: client.phone,
						currentDebt: Math.abs(this.toNumber(client.balance)),
					})),
				},
			},
		};
	}
}
