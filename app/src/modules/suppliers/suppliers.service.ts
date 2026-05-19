import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreateSupplierPaymentDto } from './dto/create-supplier-payment.dto';
import { DateRangeQueryDto } from './dto/date-range-query.dto';
import { ListSupplierPaymentsQueryDto } from './dto/list-supplier-payments-query.dto';
import { ListSuppliersQueryDto } from './dto/list-suppliers-query.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
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

	private parseDateRange(from?: string, to?: string) {
		const start = from ? new Date(from) : undefined;
		const end = to ? new Date(to) : undefined;

		return {
			start,
			end,
			where:
				start || end
					? {
						gte: start,
						lte: end,
					}
					: undefined,
		};
	}

	private async buildSupplierReceptionEvents(
		supplierId: string,
		from?: Date,
		to?: Date,
	) {
		const supplierOrders = await this.prisma.order.findMany({
			where: { supplierId },
			select: { id: true, code: true },
		});

		const orderIds = supplierOrders.map((order) => order.id);
		const orderCodeById = new Map(supplierOrders.map((order) => [order.id, order.code]));

		const movements = await this.prisma.stockMovement.findMany({
			where: {
				createdAt:
					from || to
						? {
							gte: from,
							lte: to,
						}
						: undefined,
				OR: [
					orderIds.length > 0
						? {
							type: StockMovementType.ORDER_RECEIVE,
							referenceType: 'order',
							referenceId: { in: orderIds },
						}
						: { id: '__none__' },
					{
						type: StockMovementType.ENTRY,
						referenceType: 'supplier',
						referenceId: supplierId,
					},
				],
			},
			select: {
				id: true,
				productId: true,
				type: true,
				quantity: true,
				unitCost: true,
				referenceId: true,
				note: true,
				createdAt: true,
				product: {
					select: {
						id: true,
						sku: true,
						name: true,
					},
				},
			},
			orderBy: { createdAt: 'asc' },
		});

		const fallbackOrderItemMap = new Map<string, number>();
		if (orderIds.length > 0) {
			const orderItems = await this.prisma.orderItem.findMany({
				where: { orderId: { in: orderIds } },
				select: {
					orderId: true,
					productId: true,
					unitCost: true,
				},
			});

			for (const item of orderItems) {
				fallbackOrderItemMap.set(
					`${item.orderId}:${item.productId}`,
					this.toNumber(item.unitCost),
				);
			}
		}

		const receptions = movements.map((movement) => {
			const fallbackUnitCost =
				movement.type === StockMovementType.ORDER_RECEIVE && movement.referenceId
					? fallbackOrderItemMap.get(`${movement.referenceId}:${movement.productId}`) ?? 0
					: 0;

			const unitCost = this.toNumber(movement.unitCost) || fallbackUnitCost;
			const amount = unitCost * movement.quantity;

			return {
				id: movement.id,
				type: 'RECEPTION',
				source:
					movement.type === StockMovementType.ORDER_RECEIVE ? 'ORDER_RECEIVE' : 'MANUAL_ENTRY',
				quantity: movement.quantity,
				unitCost,
				amount,
				orderId: movement.type === StockMovementType.ORDER_RECEIVE ? movement.referenceId : null,
				orderCode:
					movement.type === StockMovementType.ORDER_RECEIVE && movement.referenceId
						? orderCodeById.get(movement.referenceId) ?? null
						: null,
				note: movement.note,
				createdAt: movement.createdAt,
				product: movement.product,
			};
		});

		return receptions;
	}

	private async computeSinceDelta(supplierId: string, since?: Date) {
		const receptions = await this.buildSupplierReceptionEvents(supplierId, since, undefined);
		const totalReceivedAmount = receptions.reduce((sum, reception) => sum + reception.amount, 0);

		const payments = await this.prisma.supplierPayment.findMany({
			where: {
				supplierId,
				paidAt: since
					? {
						gte: since,
					}
					: undefined,
			},
			select: { amount: true },
		});

		const totalPaidAmount = payments.reduce((sum, payment) => sum + this.toNumber(payment.amount), 0);
		return totalPaidAmount - totalReceivedAmount;
	}

	async findAll(query: ListSuppliersQueryDto) {
		const page = query.page ?? 1;
		const limit = query.limit ?? 20;
		const skip = (page - 1) * limit;

		const where = {
			name: query.search
				? { contains: query.search, mode: 'insensitive' as const }
				: undefined,
			status: query.status,
		};

		const [data, total] = await Promise.all([
			this.prisma.supplier.findMany({
				where,
				skip,
				take: limit,
				orderBy: { createdAt: 'desc' },
			}),
			this.prisma.supplier.count({ where }),
		]);

		return {
			data,
			meta: { page, limit, total },
		};
	}

	async create(dto: CreateSupplierDto) {
		const supplier = await this.prisma.supplier.create({
			data: {
				code: dto.code,
				name: dto.name,
				phone: dto.phone,
				email: dto.email,
				address: dto.address,
				status: dto.status,
				balance: dto.balance,
			},
		});

		return { data: supplier };
	}

	async findOne(id: string) {
		const supplier = await this.prisma.supplier.findUnique({ where: { id } });
		if (!supplier) {
			throw new NotFoundException('Supplier not found');
		}
		return { data: supplier };
	}

	async update(id: string, dto: UpdateSupplierDto) {
		await this.findOne(id);
		const supplier = await this.prisma.supplier.update({
			where: { id },
			data: dto,
		});
		return { data: supplier };
	}

	async remove(id: string) {
		await this.findOne(id);
		await this.prisma.supplier.delete({ where: { id } });
		return { data: { id } };
	}

	async createPayment(supplierId: string, dto: CreateSupplierPaymentDto) {
		await this.findOne(supplierId);

		const payment = await this.prisma.$transaction(async (tx) => {
			const created = await tx.supplierPayment.create({
				data: {
					supplierId,
					amount: dto.amount,
					paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
					recordedBy: dto.recordedBy,
				},
			});

			await tx.supplier.update({
				where: { id: supplierId },
				data: {
					balance: {
						increment: this.toNumber(dto.amount),
					},
				},
			});

			return created;
		});

		return { data: payment };
	}

	async listPayments(supplierId: string, query: ListSupplierPaymentsQueryDto) {
		await this.findOne(supplierId);

		const page = query.page ?? 1;
		const limit = query.limit ?? 20;
		const skip = (page - 1) * limit;
		const range = this.parseDateRange(query.from, query.to);

		const where: Prisma.SupplierPaymentWhereInput = {
			supplierId,
			paidAt: range.where,
		};

		const [data, total] = await Promise.all([
			this.prisma.supplierPayment.findMany({
				where,
				skip,
				take: limit,
				orderBy: { paidAt: 'desc' },
			}),
			this.prisma.supplierPayment.count({ where }),
		]);

		return {
			data,
			meta: { page, limit, total },
		};
	}

	async getAccount(supplierId: string, query: DateRangeQueryDto) {
		const supplierResult = await this.findOne(supplierId);
		const supplier = supplierResult.data;

		const range = this.parseDateRange(query.from, query.to);

		const receptions = await this.buildSupplierReceptionEvents(supplierId, range.start, range.end);
		const payments = await this.prisma.supplierPayment.findMany({
			where: {
				supplierId,
				paidAt: range.where,
			},
			orderBy: { paidAt: 'asc' },
		});

		const receptionMovements = receptions.map((reception) => ({
			id: reception.id,
			type: 'RECEPTION',
			delta: -reception.amount,
			amount: reception.amount,
			quantity: reception.quantity,
			unitCost: reception.unitCost,
			source: reception.source,
			orderId: reception.orderId,
			orderCode: reception.orderCode,
			product: reception.product,
			note: reception.note,
			occurredAt: reception.createdAt,
		}));

		const paymentMovements = payments.map((payment) => ({
			id: payment.id,
			type: 'PAYMENT',
			delta: this.toNumber(payment.amount),
			amount: this.toNumber(payment.amount),
			recordedBy: payment.recordedBy,
			occurredAt: payment.paidAt,
		}));

		const movements = [...receptionMovements, ...paymentMovements].sort(
			(a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
		);

		const periodDelta = movements.reduce((sum, movement) => sum + movement.delta, 0);
		const currentBalance = this.toNumber(supplier.balance);
		const sinceFromDelta = await this.computeSinceDelta(supplierId, range.start);
		const openingBalance = currentBalance - sinceFromDelta;

		const closingBalance = openingBalance + periodDelta;

		return {
			data: {
				supplier,
				period: {
					from: range.start ?? null,
					to: range.end ?? null,
				},
				openingBalance,
				closingBalance,
				currentBalance,
				movements,
			},
		};
	}

	async getReport(supplierId: string, query: DateRangeQueryDto) {
		const supplierResult = await this.findOne(supplierId);
		const supplier = supplierResult.data;

		const range = this.parseDateRange(query.from, query.to);

		const receptions = await this.buildSupplierReceptionEvents(supplierId, range.start, range.end);
		const payments = await this.prisma.supplierPayment.findMany({
			where: {
				supplierId,
				paidAt: range.where,
			},
			select: {
				id: true,
				amount: true,
				paidAt: true,
				recordedBy: true,
			},
			orderBy: { paidAt: 'asc' },
		});

		const orderRangeWhere =
			range.start || range.end
				? {
					gte: range.start,
					lte: range.end,
				}
				: undefined;

		const ordersInPeriod = await this.prisma.order.findMany({
			where: {
				supplierId,
				orderedAt: orderRangeWhere,
			},
			select: {
				id: true,
				code: true,
				total: true,
				orderedAt: true,
				status: true,
			},
			orderBy: { orderedAt: 'asc' },
		});

		const receivedProductsById = new Map<
			string,
			{
				productId: string;
				sku: string;
				name: string;
				quantity: number;
				totalCost: number;
			}
		>();

		let totalReceivedAmount = 0;
		const concernedOrderMap = new Map<string, { id: string; code: string | null }>();

		for (const reception of receptions) {
			totalReceivedAmount += reception.amount;
			const current = receivedProductsById.get(reception.product.id);
			if (current) {
				current.quantity += reception.quantity;
				current.totalCost += reception.amount;
			} else {
				receivedProductsById.set(reception.product.id, {
					productId: reception.product.id,
					sku: reception.product.sku,
					name: reception.product.name,
					quantity: reception.quantity,
					totalCost: reception.amount,
				});
			}

			if (reception.orderId) {
				concernedOrderMap.set(reception.orderId, {
					id: reception.orderId,
					code: reception.orderCode,
				});
			}
		}

		let totalPaidAmount = 0;
		for (const payment of payments) {
			totalPaidAmount += this.toNumber(payment.amount);
		}

		let totalOrderedAmount = 0;
		for (const order of ordersInPeriod) {
			totalOrderedAmount += this.toNumber(order.total);
			concernedOrderMap.set(order.id, {
				id: order.id,
				code: order.code,
			});
		}

		const periodDelta = totalPaidAmount - totalReceivedAmount;
		const currentBalance = this.toNumber(supplier.balance);
		const sinceFromDelta = await this.computeSinceDelta(supplierId, range.start);
		const openingBalance = currentBalance - sinceFromDelta;
		const closingBalance = openingBalance + periodDelta;

		return {
			data: {
				supplier,
				period: {
					from: range.start ?? null,
					to: range.end ?? null,
				},
				summary: {
					totalOrdered: totalOrderedAmount,
					totalReceived: totalReceivedAmount,
					totalPaid: totalPaidAmount,
					periodBalanceDelta: periodDelta,
					openingBalance,
					closingBalance,
					currentBalance,
				},
				receivedProducts: Array.from(receivedProductsById.values()),
				payments: payments.map((payment) => ({
					id: payment.id,
					amount: this.toNumber(payment.amount),
					paidAt: payment.paidAt,
					recordedBy: payment.recordedBy,
				})),
				orders: ordersInPeriod.map((order) => ({
					id: order.id,
					code: order.code,
					total: this.toNumber(order.total),
					status: order.status,
					orderedAt: order.orderedAt,
				})),
				concernedOrders: Array.from(concernedOrderMap.values()),
			},
		};
	}
}
