import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';
import { CreateStockExitDto } from './dto/create-stock-exit.dto';
import {
	ListStockHistoryQueryDto,
} from './dto/list-stock-history-query.dto';
import {
	ListStockStatusQueryDto,
	StockLevelFilterDto,
} from './dto/list-stock-status-query.dto';
import { StockInsufficientException } from './exceptions';

@Injectable()
export class StockService {
	constructor(private readonly prisma: PrismaService) {}

	async getStatus(query: ListStockStatusQueryDto) {
		const page = query.page ?? 1;
		const limit = query.limit ?? 20;
		const skip = (page - 1) * limit;

		const searchLike = query.search ? `%${query.search}%` : null;
		const effectiveStockLevel =
			query.stockLevel && query.stockLevel !== StockLevelFilterDto.ALL
				? query.stockLevel
				: query.lowStockOnly
					? StockLevelFilterDto.LOW
					: StockLevelFilterDto.ALL;

		let stockCondition = Prisma.sql`1=1`;
		if (effectiveStockLevel === StockLevelFilterDto.OUT) {
			stockCondition = Prisma.sql`p."stockQuantity" = 0`;
		} else if (effectiveStockLevel === StockLevelFilterDto.LOW) {
			stockCondition = Prisma.sql`p."stockQuantity" <= p."stockMinThreshold"`;
		} else if (effectiveStockLevel === StockLevelFilterDto.AVAILABLE) {
			stockCondition = Prisma.sql`p."stockQuantity" > p."stockMinThreshold"`;
		}

		const [rows, totalRows] = await Promise.all([
			this.prisma.$queryRaw<
				Array<{
					id: string;
					sku: string;
					name: string;
					stockQuantity: number;
					stockMinThreshold: number;
					status: string;
					updatedAt: Date;
					categoryName: string | null;
				}>
			>(
				Prisma.sql`
					SELECT
						p."id",
						p."sku",
						p."name",
						p."stockQuantity",
						p."stockMinThreshold",
						p."status",
						p."updatedAt",
						c."name" AS "categoryName"
					FROM "Product" p
					LEFT JOIN "Category" c ON c."id" = p."categoryId"
					WHERE ${stockCondition}
						AND (
							${searchLike} IS NULL
							OR p."name" ILIKE ${searchLike}
							OR p."sku" ILIKE ${searchLike}
							OR c."name" ILIKE ${searchLike}
						)
					ORDER BY p."updatedAt" DESC
					LIMIT ${limit}
					OFFSET ${skip}
				`,
			),
			this.prisma.$queryRaw<Array<{ total: bigint }>>(
				Prisma.sql`
					SELECT COUNT(*)::bigint AS total
					FROM "Product" p
					LEFT JOIN "Category" c ON c."id" = p."categoryId"
					WHERE ${stockCondition}
						AND (
							${searchLike} IS NULL
							OR p."name" ILIKE ${searchLike}
							OR p."sku" ILIKE ${searchLike}
							OR c."name" ILIKE ${searchLike}
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

	async getHistory(query: ListStockHistoryQueryDto) {
		const page = query.page ?? 1;
		const limit = query.limit ?? 20;
		const skip = (page - 1) * limit;

		const where: Prisma.StockMovementWhereInput = {
			productId: query.productId,
			type: query.type as StockMovementType | undefined,
			OR: query.search
				? [
						{ note: { contains: query.search, mode: 'insensitive' } },
						{ referenceId: { contains: query.search, mode: 'insensitive' } },
						{
							product: { name: { contains: query.search, mode: 'insensitive' } },
						},
						{ product: { sku: { contains: query.search, mode: 'insensitive' } } },
					]
				: undefined,
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
							category: {
								select: {
									id: true,
									name: true,
								},
							},
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
					referenceId: dto.reference,
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
					referenceId: dto.reference,
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
					referenceId: dto.reference,
					note: dto.note,
				},
			});

			return { movement, product: updatedProduct };
		});

		return { data: result };
	}
}
