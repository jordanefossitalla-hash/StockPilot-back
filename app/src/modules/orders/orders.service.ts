import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma, StockMovementType } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { ReceiveOrderDto } from './dto/receive-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
	constructor(private readonly prisma: PrismaService) {}

	async findAll(query: ListOrdersQueryDto) {
		const page = query.page ?? 1;
		const limit = query.limit ?? 20;
		const skip = (page - 1) * limit;

		const where: Prisma.OrderWhereInput = {
			status: query.status,
			supplierId: query.supplierId,
			orderedAt:
				query.from || query.to
					? {
							gte: query.from ? new Date(query.from) : undefined,
							lte: query.to ? new Date(query.to) : undefined,
						}
					: undefined,
		};

		const [data, total] = await Promise.all([
			this.prisma.order.findMany({
				where,
				skip,
				take: limit,
				orderBy: { orderedAt: 'desc' },
			}),
			this.prisma.order.count({ where }),
		]);

		return { data, meta: { page, limit, total } };
	}

	async create(dto: CreateOrderDto) {
		const code = this.generateCode('ORD');

		const order = await this.prisma.$transaction(async (tx) => {
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
				subtotal += item.quantity * item.unitCost;
			}

			const createdOrder = await tx.order.create({
				data: {
					code,
					supplierId: dto.supplierId,
					status: OrderStatus.ORDERED,
					subtotal,
					total: subtotal,
				},
			});

			await tx.orderItem.createMany({
				data: dto.items.map((item) => ({
					orderId: createdOrder.id,
					productId: item.productId,
					quantity: item.quantity,
					unitCost: item.unitCost,
					lineTotal: item.quantity * item.unitCost,
				})),
			});

			return createdOrder;
		});

		return this.findOne(order.id);
	}

	async findOne(id: string) {
		const order = await this.prisma.order.findUnique({
			where: { id },
			include: { items: true },
		});
		if (!order) {
			throw new NotFoundException('Order not found');
		}
		return { data: order };
	}

	async update(id: string, dto: UpdateOrderDto) {
		await this.findOne(id);
		const order = await this.prisma.order.update({
			where: { id },
			data: {
				status: dto.status,
			},
		});
		return { data: order };
	}

	async receive(id: string, dto: ReceiveOrderDto) {
		const data = await this.prisma.$transaction(async (tx) => {
			const order = await tx.order.findUnique({
				where: { id },
				include: { items: true },
			});
			if (!order) {
				throw new NotFoundException('Order not found');
			}
			if (order.status === OrderStatus.CANCELLED) {
				throw new BadRequestException('Cannot receive a cancelled order');
			}

			const itemMap = new Map(order.items.map((i) => [i.productId, i]));
			for (const line of dto.items) {
				const item = itemMap.get(line.productId);
				if (!item) {
					throw new BadRequestException('Order item not found for product');
				}

				const remaining = item.quantity - item.receivedQuantity;
				if (line.quantity > remaining) {
					throw new BadRequestException('Received quantity exceeds remaining quantity');
				}

				await tx.orderItem.update({
					where: { id: item.id },
					data: {
						receivedQuantity: { increment: line.quantity },
					},
				});

				await tx.product.update({
					where: { id: line.productId },
					data: {
						stockQuantity: { increment: line.quantity },
					},
				});

				await tx.stockMovement.create({
					data: {
						productId: line.productId,
						type: StockMovementType.ORDER_RECEIVE,
						quantity: line.quantity,
						unitCost: item.unitCost,
						referenceType: 'order',
						referenceId: order.id,
					},
				});
			}

			const refreshedItems = await tx.orderItem.findMany({ where: { orderId: id } });
			const allReceived = refreshedItems.every(
				(item) => item.receivedQuantity >= item.quantity,
			);

			return tx.order.update({
				where: { id },
				data: {
					status: allReceived ? OrderStatus.RECEIVED : OrderStatus.PARTIAL_RECEIVED,
					receivedAt: allReceived ? new Date() : null,
				},
			});
		});

		return { data };
	}

	async cancel(id: string) {
		await this.findOne(id);
		const order = await this.prisma.order.update({
			where: { id },
			data: { status: OrderStatus.CANCELLED },
		});
		return { data: order };
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
