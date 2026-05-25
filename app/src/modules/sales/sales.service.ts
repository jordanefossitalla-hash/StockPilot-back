import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ClientOrderDeliveryStatus, Prisma, SaleStatus, StockMovementType } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { StockInsufficientException } from '../stock/exceptions';
import { CreateSalePaymentDto } from './dto/create-sale-payment.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ListSalesReportQueryDto, SalesReportGroupByDto } from './dto/list-sales-report-query.dto';
import { ListSalesQueryDto } from './dto/list-sales-query.dto';

@Injectable()
export class SalesService {
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

	async findAll(query: ListSalesQueryDto) {
		const page = query.page ?? 1;
		const limit = query.limit ?? 20;
		const skip = (page - 1) * limit;

		const where: Prisma.SaleWhereInput = {
			status: query.status,
			clientId: query.clientId,
			OR: query.search
				? [
						{ code: { contains: query.search, mode: 'insensitive' } },
						{ client: { name: { contains: query.search, mode: 'insensitive' } } },
						{ items: { some: { product: { name: { contains: query.search, mode: 'insensitive' } } } } },
						{ items: { some: { product: { sku: { contains: query.search, mode: 'insensitive' } } } } },
					]
				: undefined,
			soldAt:
				query.from || query.to
					? {
							gte: query.from ? new Date(query.from) : undefined,
							lte: query.to ? new Date(query.to) : undefined,
						}
					: undefined,
		};

		const [data, total] = await Promise.all([
			this.prisma.sale.findMany({
				where,
				skip,
				take: limit,
				orderBy: { soldAt: 'desc' },
				include: {
					client: {
						select: {
							id: true,
							code: true,
							name: true,
							phone: true,
						},
					},
					items: {
						select: {
							id: true,
							productId: true,
							quantity: true,
							unitPrice: true,
							unitCostSnapshot: true,
							lineTotal: true,
							lineCostTotal: true,
							lineProfit: true,
							product: {
								select: {
									id: true,
									sku: true,
									name: true,
								},
							},
						},
					},
					_count: {
						select: {
							payments: true,
						},
					},
				},
			}),
			this.prisma.sale.count({ where }),
		]);

		return { data, meta: { page, limit, total } };
	}

	async getReport(query: ListSalesReportQueryDto) {
		const where: Prisma.SaleWhereInput = {
			status: query.status,
			clientId: query.clientId,
			OR: query.search
				? [
						{ code: { contains: query.search, mode: 'insensitive' } },
						{ client: { name: { contains: query.search, mode: 'insensitive' } } },
						{ items: { some: { product: { name: { contains: query.search, mode: 'insensitive' } } } } },
						{ items: { some: { product: { sku: { contains: query.search, mode: 'insensitive' } } } } },
				  ]
				: undefined,
			soldAt:
				query.from || query.to
					? {
						gte: query.from ? new Date(query.from) : undefined,
						lte: query.to ? new Date(query.to) : undefined,
					}
					: undefined,
		};

		const sales = await this.prisma.sale.findMany({
			where,
			orderBy: { soldAt: 'asc' },
			include: {
				client: {
					select: {
						id: true,
						code: true,
						name: true,
						phone: true,
					},
				},
				items: {
					select: {
						id: true,
						productId: true,
						quantity: true,
						unitPrice: true,
						unitCostSnapshot: true,
						lineTotal: true,
						lineCostTotal: true,
						lineProfit: true,
						product: {
							select: {
								id: true,
								sku: true,
								name: true,
								costPrice: true,
							},
						},
					},
				},
				payments: {
					select: {
						id: true,
						amount: true,
						method: true,
						paidAt: true,
					},
					orderBy: { paidAt: 'asc' },
				},
			},
		});

		const topProductsMap = new Map<
			string,
			{ productId: string; sku: string; name: string; quantitySold: number; revenue: number; costTotal: number; profit: number }
		>();
		const topClientsMap = new Map<
			string,
			{ clientId: string; code: string; name: string; salesCount: number; revenue: number; paidAmount: number; profit: number }
		>();
		const byStatusMap = new Map<string, { status: string; count: number; total: number }>();
		const evolutionMap = new Map<
			string,
			{ period: string; revenue: number; collected: number; outstanding: number; profit: number }
		>();

		let salesCount = 0;
		let grossRevenue = 0;
		let totalCollected = 0;
		let totalOutstanding = 0;
		let cancelledSalesCount = 0;
		let totalItemsSold = 0;
		let costTotal = 0;
		let profitTotal = 0;

		const detailedSales = sales.map((sale) => {
			const saleTotal = this.toNumber(sale.total);
			const salePaid = this.toNumber(sale.paidAmount);
			const saleOutstanding = this.toNumber(sale.remainingAmount);
			const lineItems = sale.items.map((item) => {
				const snapshotUnitCost = this.toNumber(item.unitCostSnapshot);
				const fallbackUnitCost = this.toNumber(item.product.costPrice);
				const effectiveUnitCost = snapshotUnitCost > 0 ? snapshotUnitCost : fallbackUnitCost;
				const storedLineCost = this.toNumber(item.lineCostTotal);
				const lineCostTotal = storedLineCost > 0 ? storedLineCost : item.quantity * effectiveUnitCost;
				const storedLineProfit = this.toNumber(item.lineProfit);
				const lineTotal = this.toNumber(item.lineTotal);
				const lineProfit = storedLineProfit !== 0 || lineTotal === 0 ? storedLineProfit : lineTotal - lineCostTotal;

				totalItemsSold += item.quantity;

				const productEntry = topProductsMap.get(item.productId) ?? {
					productId: item.productId,
					sku: item.product.sku,
					name: item.product.name,
					quantitySold: 0,
					revenue: 0,
					costTotal: 0,
					profit: 0,
				};
				productEntry.quantitySold += item.quantity;
				productEntry.revenue += lineTotal;
				productEntry.costTotal += lineCostTotal;
				productEntry.profit += lineProfit;
				topProductsMap.set(item.productId, productEntry);

				return {
					id: item.id,
					productId: item.productId,
					quantity: item.quantity,
					unitPrice: this.toNumber(item.unitPrice),
					unitCostSnapshot: effectiveUnitCost,
					lineTotal,
					lineCostTotal,
					lineProfit,
					product: {
						id: item.product.id,
						sku: item.product.sku,
						name: item.product.name,
					},
				};
			});

			const saleCostTotal = lineItems.reduce((sum, item) => sum + item.lineCostTotal, 0);
			const saleProfitTotal = lineItems.reduce((sum, item) => sum + item.lineProfit, 0);
			const isCancelled = sale.status === SaleStatus.CANCELLED;

			const statusEntry = byStatusMap.get(sale.status) ?? {
				status: sale.status,
				count: 0,
				total: 0,
			};
			statusEntry.count += 1;
			statusEntry.total += saleTotal;
			byStatusMap.set(sale.status, statusEntry);

			if (isCancelled) {
				cancelledSalesCount += 1;
			} else {
				salesCount += 1;
				grossRevenue += saleTotal;
				totalCollected += salePaid;
				totalOutstanding += saleOutstanding;
				costTotal += saleCostTotal;
				profitTotal += saleProfitTotal;
				const periodKey = this.getPeriodKey(sale.soldAt, query.groupBy ?? SalesReportGroupByDto.DAY);
				const evolutionEntry = evolutionMap.get(periodKey) ?? {
					period: periodKey,
					revenue: 0,
					collected: 0,
					outstanding: 0,
					profit: 0,
				};
				evolutionEntry.revenue += saleTotal;
				evolutionEntry.collected += salePaid;
				evolutionEntry.outstanding += saleOutstanding;
				evolutionEntry.profit += saleProfitTotal;
				evolutionMap.set(periodKey, evolutionEntry);

				if (sale.client) {
					const clientEntry = topClientsMap.get(sale.client.id) ?? {
						clientId: sale.client.id,
						code: sale.client.code,
						name: sale.client.name,
						salesCount: 0,
						revenue: 0,
						paidAmount: 0,
						profit: 0,
					};
					clientEntry.salesCount += 1;
					clientEntry.revenue += saleTotal;
					clientEntry.paidAmount += salePaid;
					clientEntry.profit += saleProfitTotal;
					topClientsMap.set(sale.client.id, clientEntry);
				}
			}

			return {
				id: sale.id,
				code: sale.code,
				soldAt: sale.soldAt,
				status: sale.status,
				client: sale.client,
				total: saleTotal,
				costTotal: saleCostTotal,
				profitTotal: saleProfitTotal,
				paidAmount: salePaid,
				remainingAmount: saleOutstanding,
				payments: sale.payments.map((payment) => ({
					id: payment.id,
					amount: this.toNumber(payment.amount),
					method: payment.method,
					paidAt: payment.paidAt,
				})),
				items: lineItems,
			};
		});

		const averageTicket = salesCount > 0 ? grossRevenue / salesCount : 0;
		const marginRate = grossRevenue > 0 ? (profitTotal / grossRevenue) * 100 : 0;
		const collectionRate = grossRevenue > 0 ? (totalCollected / grossRevenue) * 100 : 0;

		return {
			data: {
				period: {
					from: query.from ?? null,
					to: query.to ?? null,
					groupBy: query.groupBy ?? SalesReportGroupByDto.DAY,
				},
				summary: {
					salesCount,
					grossRevenue,
					totalCollected,
					totalOutstanding,
					cancelledSalesCount,
					averageTicket,
					totalItemsSold,
					costTotal,
					profitTotal,
					marginRate,
					collectionRate,
					profitMode: 'SNAPSHOT_AT_SALE_WITH_LEGACY_FALLBACK',
				},
				byStatus: Array.from(byStatusMap.values()).sort((left, right) =>
					left.status.localeCompare(right.status),
				),
				evolution: Array.from(evolutionMap.values()).sort((left, right) =>
					left.period.localeCompare(right.period),
				),
				topProducts: Array.from(topProductsMap.values())
					.sort((left, right) => right.revenue - left.revenue)
					.slice(0, 10),
				topClients: Array.from(topClientsMap.values())
					.sort((left, right) => right.revenue - left.revenue)
					.slice(0, 10),
				sales: detailedSales,
			},
		};
	}

	async create(dto: CreateSaleDto) {
		const code = this.generateCode('SAL');

		const result = await this.prisma.$transaction(async (tx) => {
			let saleClientId = dto.clientId;
			if (dto.clientOrderId) {
				const clientOrder = await tx.clientOrder.findUnique({
					where: { id: dto.clientOrderId },
					select: { id: true, clientId: true },
				});

				if (!clientOrder) {
					throw new NotFoundException('Client order not found');
				}

				if (dto.clientId && dto.clientId !== clientOrder.clientId) {
					throw new BadRequestException(
						'Sale clientId must match linked client order clientId',
					);
				}

				const existingLinkedSale = await tx.sale.findFirst({
					where: {
						clientOrderId: dto.clientOrderId,
						status: { not: SaleStatus.CANCELLED },
					},
					select: { id: true },
				});

				if (existingLinkedSale) {
					throw new BadRequestException(
						'A non-cancelled sale already exists for this client order',
					);
				}

				saleClientId = clientOrder.clientId;
			}

			const productIds = [...new Set(dto.items.map((item) => item.productId))];
			const products = await tx.product.findMany({
				where: { id: { in: productIds } },
				select: { id: true, costPrice: true },
			});

			if (products.length !== productIds.length) {
				throw new NotFoundException('One or more products not found');
			}

			const productMap = new Map(
				products.map((product) => [product.id, this.toNumber(product.costPrice)]),
			);

			let subtotal = 0;
			let costTotal = 0;
			for (const item of dto.items) {
				subtotal += item.quantity * item.unitPrice;
				costTotal += item.quantity * (productMap.get(item.productId) ?? 0);
			}

			const total = subtotal;
			const profitTotal = total - costTotal;
			const paidAmount = Math.min(dto.paidAmount ?? 0, total);
			const remainingAmount = Math.max(total - paidAmount, 0);
			const status = this.getSaleStatus(total, paidAmount, false);

			const sale = await tx.sale.create({
				data: {
					code,
					clientId: saleClientId,
					clientOrderId: dto.clientOrderId,
					status,
					subtotal,
					total,
					costTotal,
					profitTotal,
					paidAmount,
					remainingAmount,
				},
			});

			await tx.saleItem.createMany({
				data: dto.items.map((item) => {
					const unitCostSnapshot = productMap.get(item.productId) ?? 0;
					const lineTotal = item.quantity * item.unitPrice;
					const lineCostTotal = item.quantity * unitCostSnapshot;
					return {
						saleId: sale.id,
						productId: item.productId,
						quantity: item.quantity,
						unitPrice: item.unitPrice,
						unitCostSnapshot,
						lineTotal,
						lineCostTotal,
						lineProfit: lineTotal - lineCostTotal,
					};
				}),
			});

			for (const item of dto.items) {
				const updatedRows = await tx.product.updateMany({
					where: {
						id: item.productId,
						stockQuantity: { gte: item.quantity },
					},
					data: {
						stockQuantity: { decrement: item.quantity },
					},
				});

				if (updatedRows.count === 0) {
					throw new StockInsufficientException();
				}

				await tx.stockMovement.create({
					data: {
						productId: item.productId,
						type: StockMovementType.SALE,
						quantity: item.quantity,
						referenceType: 'sale',
						referenceId: sale.id,
						note: dto.note,
					},
				});
			}

			if (paidAmount > 0) {
				await tx.salePayment.create({
					data: {
						saleId: sale.id,
						amount: paidAmount,
						method: 'cash',
					},
				});
			}

			if (saleClientId && remainingAmount > 0) {
				await tx.client.update({
					where: { id: saleClientId },
					data: {
						balance: { decrement: remainingAmount },
					},
				});
			}

			if (dto.clientOrderId) {
				await tx.clientOrder.update({
					where: { id: dto.clientOrderId },
					data: {
						deliveryStatus: ClientOrderDeliveryStatus.DELIVERED,
						deliveredAt: new Date(),
					},
				});
			}

			return sale;
		});

		return this.findOne(result.id);
	}

	async findOne(id: string) {
		const sale = await this.prisma.sale.findUnique({
			where: { id },
			include: {
				clientOrder: {
					select: {
						id: true,
						code: true,
						deliveryStatus: true,
						deliveryDueAt: true,
						deliveredAt: true,
					},
				},
				items: {
					include: {
						product: {
							select: {
								id: true,
								sku: true,
								name: true,
							},
						},
					},
				},
				payments: true,
			},
		});

		if (!sale) {
			throw new NotFoundException('Sale not found');
		}

		return { data: sale };
	}

	async addPayment(id: string, dto: CreateSalePaymentDto) {
		const data = await this.prisma.$transaction(async (tx) => {
			const sale = await tx.sale.findUnique({ where: { id } });
			if (!sale) {
				throw new NotFoundException('Sale not found');
			}
			if (sale.status === SaleStatus.CANCELLED) {
				throw new BadRequestException('Cannot pay a cancelled sale');
			}
			if (Number(sale.remainingAmount) <= 0) {
				throw new BadRequestException('Sale is already fully paid');
			}

			const nextPaidAmount = Number(sale.paidAmount) + dto.amount;
			const cappedPaidAmount = Math.min(nextPaidAmount, Number(sale.total));
			const paymentApplied = Math.max(cappedPaidAmount - Number(sale.paidAmount), 0);
			const remainingAmount = Math.max(Number(sale.total) - cappedPaidAmount, 0);

			if (paymentApplied <= 0) {
				throw new BadRequestException('No payable amount remaining for this sale');
			}

			const updated = await tx.sale.update({
				where: { id },
				data: {
					paidAmount: cappedPaidAmount,
					remainingAmount,
					status: this.getSaleStatus(Number(sale.total), cappedPaidAmount, false),
				},
			});

			await tx.salePayment.create({
				data: {
					saleId: id,
					amount: paymentApplied,
					method: dto.method,
					recordedBy: dto.recordedBy,
				},
			});

			if (sale.clientId) {
				await tx.client.update({
					where: { id: sale.clientId },
					data: {
						balance: { increment: paymentApplied },
					},
				});
			}

			return updated;
		});

		return { data };
	}

	async cancel(id: string) {
		const data = await this.prisma.$transaction(async (tx) => {
			const sale = await tx.sale.findUnique({
				where: { id },
				include: { items: true },
			});
			if (!sale) {
				throw new NotFoundException('Sale not found');
			}
			if (sale.status === SaleStatus.CANCELLED) {
				return sale;
			}

			const outstandingBeforeCancel = Number(sale.remainingAmount);

			for (const item of sale.items) {
				await tx.product.update({
					where: { id: item.productId },
					data: { stockQuantity: { increment: item.quantity } },
				});

				await tx.stockMovement.create({
					data: {
						productId: item.productId,
						type: StockMovementType.ADJUSTMENT,
						quantity: item.quantity,
						referenceType: 'sale',
						referenceId: sale.id,
						note: 'Sale cancellation restock',
					},
				});
			}

			if (sale.clientOrderId) {
				await tx.clientOrder.update({
					where: { id: sale.clientOrderId },
					data: {
						deliveryStatus: ClientOrderDeliveryStatus.TO_DELIVER,
						deliveredAt: null,
					},
				});
			}

			if (sale.clientId && outstandingBeforeCancel > 0) {
				await tx.client.update({
					where: { id: sale.clientId },
					data: {
						balance: { increment: outstandingBeforeCancel },
					},
				});
			}

			return tx.sale.update({
				where: { id },
				data: {
					status: SaleStatus.CANCELLED,
					remainingAmount: 0,
				},
			});
		});

		return { data };
	}

	private getSaleStatus(total: number, paidAmount: number, isCancelled: boolean) {
		if (isCancelled) {
			return SaleStatus.CANCELLED;
		}
		if (paidAmount >= total) {
			return SaleStatus.PAID;
		}
		if (paidAmount > 0) {
			return SaleStatus.PARTIAL;
		}
		return SaleStatus.CONFIRMED;
	}

	private generateCode(prefix: string) {
		const now = new Date();
		const stamp = `${now.getFullYear()}${(now.getMonth() + 1)
			.toString()
			.padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now
			.getHours()
			.toString()
			.padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now
			.getSeconds()
			.toString()
			.padStart(2, '0')}`;
		const rand = Math.floor(Math.random() * 900 + 100);
		return `${prefix}-${stamp}-${rand}`;
	}

	private getPeriodKey(date: Date, groupBy: SalesReportGroupByDto) {
		if (groupBy === SalesReportGroupByDto.MONTH) {
			return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
		}

		if (groupBy === SalesReportGroupByDto.WEEK) {
			const weekStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
			const day = weekStart.getUTCDay() || 7;
			weekStart.setUTCDate(weekStart.getUTCDate() - day + 1);
			return weekStart.toISOString().slice(0, 10);
		}

		return date.toISOString().slice(0, 10);
	}
}
