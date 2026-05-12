import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';
import { CreateStockExitDto } from './dto/create-stock-exit.dto';
import { ListStockHistoryQueryDto } from './dto/list-stock-history-query.dto';
import { ListStockStatusQueryDto } from './dto/list-stock-status-query.dto';
import { StockInsufficientException } from './exceptions';

@Injectable()
export class StockService {
	constructor(private readonly prisma: PrismaService) {}

	async getStatus(query: ListStockStatusQueryDto) {
		const page = query.page ?? 1;
		const limit = query.limit ?? 20;
		const skip = (page - 1) * limit;

		if (query.lowStockOnly) {
			const searchLike = query.search ? `%${query.search}%` : null;

			const [rows, totalRows] = await Promise.all([
				this.prisma.$queryRaw<
					Array<{
						id: string;
						sku: string;
						name: string;
						stockQuantity: number;
						stockMinThreshold: number;
						status: string;
					}>
				>(
					Prisma.sql`
						SELECT p."id", p."sku", p."name", p."stockQuantity", p."stockMinThreshold", p."status"
						FROM "Product" p
						WHERE p."stockQuantity" <= p."stockMinThreshold"
							AND (
								${searchLike} IS NULL
								OR p."name" ILIKE ${searchLike}
								OR p."sku" ILIKE ${searchLike}
							)
						ORDER BY p."createdAt" DESC
						LIMIT ${limit}
						OFFSET ${skip}
					`,
				),
				this.prisma.$queryRaw<Array<{ total: bigint }>>(
					Prisma.sql`
						SELECT COUNT(*)::bigint AS total
						FROM "Product" p
						WHERE p."stockQuantity" <= p."stockMinThreshold"
							AND (
								${searchLike} IS NULL
								OR p."name" ILIKE ${searchLike}
								OR p."sku" ILIKE ${searchLike}
							)
					`,
				),
			]);

			return {
				data: rows,
				meta: {
					page,
					limit,
					total: Number(totalRows[0]?.total ?? 0),
				},
			};
		}

		const where = {
			OR: query.search
				? [
						{ name: { contains: query.search, mode: 'insensitive' as const } },
						{ sku: { contains: query.search, mode: 'insensitive' as const } },
					]
				: undefined,
		};

		const [data, total] = await Promise.all([
			this.prisma.product.findMany({
				where,
				skip,
				take: limit,
				orderBy: { createdAt: 'desc' },
				select: {
					id: true,
					sku: true,
					name: true,
					stockQuantity: true,
					stockMinThreshold: true,
					status: true,
				},
			}),
			this.prisma.product.count({ where }),
		]);

		return {
			data,
			meta: { page, limit, total },
		};
	}

	async getHistory(query: ListStockHistoryQueryDto) {
		const page = query.page ?? 1;
		const limit = query.limit ?? 20;
		const skip = (page - 1) * limit;

		const where: Prisma.StockMovementWhereInput = {
			productId: query.productId,
			createdAt:
				query.from || query.to
					? {
							gte: query.from ? new Date(query.from) : undefined,
							lte: query.to ? new Date(query.to) : undefined,
						}
					: undefined,
		};

		const [data, total] = await Promise.all([
			this.prisma.stockMovement.findMany({
				where,
				skip,
				take: limit,
				orderBy: { createdAt: 'desc' },
				include: {
					product: {
						select: {
							id: true,
							sku: true,
							name: true,
						},
					},
				},
			}),
			this.prisma.stockMovement.count({ where }),
		]);

		return {
			data,
			meta: { page, limit, total },
		};
	}

	async createEntry(dto: CreateStockEntryDto) {
		const result = await this.prisma.$transaction(async (tx) => {
			const product = await tx.product.findUnique({ where: { id: dto.productId } });
			if (!product) {
				throw new NotFoundException('Product not found');
			}

			const updatedProduct = await tx.product.update({
				where: { id: dto.productId },
				data: {
					stockQuantity: { increment: dto.quantity },
				},
			});

			const movement = await tx.stockMovement.create({
				data: {
					productId: dto.productId,
					type: StockMovementType.ENTRY,
					quantity: dto.quantity,
					unitCost: dto.unitCost,
					referenceType: 'manual',
					note: dto.note,
				},
			});

			return { movement, product: updatedProduct };
		});

		return { data: result };
	}

	async createExit(dto: CreateStockExitDto) {
		const result = await this.prisma.$transaction(async (tx) => {
			const product = await tx.product.findUnique({ where: { id: dto.productId } });
			if (!product) {
				throw new NotFoundException('Product not found');
			}

			const updatedRows = await tx.product.updateMany({
				where: {
					id: dto.productId,
					stockQuantity: { gte: dto.quantity },
				},
				data: {
					stockQuantity: { decrement: dto.quantity },
				},
			});

			if (updatedRows.count === 0) {
				throw new StockInsufficientException();
			}

			const updatedProduct = await tx.product.findUnique({ where: { id: dto.productId } });
			const movement = await tx.stockMovement.create({
				data: {
					productId: dto.productId,
					type: StockMovementType.EXIT,
					quantity: dto.quantity,
					referenceType: 'manual',
					note: dto.note,
				},
			});

			return { movement, product: updatedProduct };
		});

		return { data: result };
	}

	async createAdjustment(dto: CreateStockAdjustmentDto) {
		const result = await this.prisma.$transaction(async (tx) => {
			const product = await tx.product.findUnique({ where: { id: dto.productId } });
			if (!product) {
				throw new NotFoundException('Product not found');
			}

			if (dto.quantityDelta < 0) {
				const updatedRows = await tx.product.updateMany({
					where: {
						id: dto.productId,
						stockQuantity: { gte: Math.abs(dto.quantityDelta) },
					},
					data: {
						stockQuantity: { decrement: Math.abs(dto.quantityDelta) },
					},
				});

				if (updatedRows.count === 0) {
					throw new StockInsufficientException();
				}
			} else if (dto.quantityDelta > 0) {
				await tx.product.update({
					where: { id: dto.productId },
					data: {
						stockQuantity: { increment: dto.quantityDelta },
					},
				});
			}

			const updatedProduct = await tx.product.findUnique({ where: { id: dto.productId } });
			const movement = await tx.stockMovement.create({
				data: {
					productId: dto.productId,
					type: StockMovementType.ADJUSTMENT,
					quantity: dto.quantityDelta,
					referenceType: 'manual',
					note: dto.note,
				},
			});

			return { movement, product: updatedProduct };
		});

		return { data: result };
	}
}
