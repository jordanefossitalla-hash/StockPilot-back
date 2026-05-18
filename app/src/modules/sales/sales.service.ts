import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ClientOrderDeliveryStatus, Prisma, SaleStatus, StockMovementType } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { StockInsufficientException } from '../stock/exceptions';
import { CreateSalePaymentDto } from './dto/create-sale-payment.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ListSalesQueryDto } from './dto/list-sales-query.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

@Injectable()
export class SalesService {
	constructor(private readonly prisma: PrismaService) {}

	async findAll(query: ListSalesQueryDto) {
		const page = query.page ?? 1;
		const limit = query.limit ?? 20;
		const skip = (page - 1) * limit;

		const where: Prisma.SaleWhereInput = {
			status: query.status,
			clientId: query.clientId,
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
			}),
			this.prisma.sale.count({ where }),
		]);

		return { data, meta: { page, limit, total } };
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
				select: { id: true },
			});

			if (products.length !== productIds.length) {
				throw new NotFoundException('One or more products not found');
			}

			let subtotal = 0;
			for (const item of dto.items) {
				subtotal += item.quantity * item.unitPrice;
			}

			const total = subtotal;
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
					paidAmount,
					remainingAmount,
				},
			});

			await tx.saleItem.createMany({
				data: dto.items.map((item) => ({
					saleId: sale.id,
					productId: item.productId,
					quantity: item.quantity,
					unitPrice: item.unitPrice,
					lineTotal: item.quantity * item.unitPrice,
				})),
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
				items: true,
				payments: true,
			},
		});

		if (!sale) {
			throw new NotFoundException('Sale not found');
		}

		return { data: sale };
	}

	async update(id: string, dto: UpdateSaleDto) {
		await this.findOne(id);
		const sale = await this.prisma.sale.update({
			where: { id },
			data: {
				status: dto.status,
			},
		});
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

			const nextPaidAmount = Number(sale.paidAmount) + dto.amount;
			const cappedPaidAmount = Math.min(nextPaidAmount, Number(sale.total));
			const remainingAmount = Math.max(Number(sale.total) - cappedPaidAmount, 0);

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
					amount: dto.amount,
					method: dto.method,
					recordedBy: dto.recordedBy,
				},
			});

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

			return tx.sale.update({
				where: { id },
				data: { status: SaleStatus.CANCELLED },
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
}
