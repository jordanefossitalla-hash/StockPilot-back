import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class DashboardService {
	constructor(private readonly prisma: PrismaService) {}

	async getMetrics() {
		const [products, clients, suppliers, salesCount, ordersCount, salesTotals] =
			await Promise.all([
				this.prisma.product.count(),
				this.prisma.client.count(),
				this.prisma.supplier.count(),
				this.prisma.sale.count(),
				this.prisma.order.count(),
				this.prisma.sale.aggregate({
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
}
