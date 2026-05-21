import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import {
	ClientAccountSortByDto,
	ClientAccountSortOrderDto,
	ClientAccountTypeDto,
	ListClientAccountStatusQueryDto,
} from './dto/list-client-account-status-query.dto';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
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

	async findAll(query: ListClientsQueryDto) {
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
			this.prisma.client.findMany({
				where,
				skip,
				take: limit,
				orderBy: { createdAt: 'desc' },
			}),
			this.prisma.client.count({ where }),
		]);

		return {
			data,
			meta: { page, limit, total },
		};
	}

	async listAccountStatus(query: ListClientAccountStatusQueryDto) {
		const page = query.page ?? 1;
		const limit = query.limit ?? 20;
		const skip = (page - 1) * limit;
		const searchLike = query.search ? `%${query.search}%` : null;
		const minAmount = query.minAmount ?? 0;
		const includeSettled = query.includeSettled ?? false;
		const accountType = query.accountType ?? ClientAccountTypeDto.ALL;

		let accountTypeCondition = Prisma.sql`1=1`;
		if (accountType === ClientAccountTypeDto.DEBT) {
			accountTypeCondition = Prisma.sql`COALESCE(c."balance", 0) < 0`;
		} else if (accountType === ClientAccountTypeDto.ADVANCE) {
			accountTypeCondition = Prisma.sql`COALESCE(c."balance", 0) > 0`;
		} else if (accountType === ClientAccountTypeDto.SETTLED) {
			accountTypeCondition = Prisma.sql`COALESCE(c."balance", 0) = 0`;
		}

		let settledCondition = Prisma.sql`1=1`;
		if (!includeSettled && accountType === ClientAccountTypeDto.ALL) {
			settledCondition = Prisma.sql`COALESCE(c."balance", 0) <> 0`;
		}

		const orderDirection =
			(query.sortOrder ?? ClientAccountSortOrderDto.DESC) === ClientAccountSortOrderDto.ASC
				? Prisma.sql`ASC`
				: Prisma.sql`DESC`;

		let orderClause = Prisma.sql`ABS(COALESCE(c."balance", 0)) ${orderDirection}, c."name" ASC`;
		if ((query.sortBy ?? ClientAccountSortByDto.AMOUNT) === ClientAccountSortByDto.LAST_SALE_AT) {
			orderClause = Prisma.sql`ss."lastSaleAt" ${orderDirection} NULLS LAST, c."name" ASC`;
		} else if (query.sortBy === ClientAccountSortByDto.NAME) {
			orderClause = Prisma.sql`c."name" ${orderDirection}, ABS(COALESCE(c."balance", 0)) DESC`;
		} else if (query.sortBy === ClientAccountSortByDto.CODE) {
			orderClause = Prisma.sql`c."code" ${orderDirection}, ABS(COALESCE(c."balance", 0)) DESC`;
		}

		const baseQuery = Prisma.sql`
			WITH sale_summary AS (
				SELECT
					s."clientId",
					COUNT(*)::int AS "salesCount",
					COALESCE(SUM(s."total"), 0)::float8 AS "totalPurchased",
					COALESCE(SUM(s."paidAmount"), 0)::float8 AS "totalPaid",
					COALESCE(SUM(s."remainingAmount"), 0)::float8 AS "outstandingSalesDebt",
					MAX(s."soldAt") AS "lastSaleAt"
				FROM "Sale" s
				WHERE s."clientId" IS NOT NULL
					AND s."status" <> 'CANCELLED'
				GROUP BY s."clientId"
			),
			payment_summary AS (
				SELECT
					s."clientId",
					MAX(sp."paidAt") AS "lastPaymentAt"
				FROM "SalePayment" sp
				INNER JOIN "Sale" s ON s."id" = sp."saleId"
				WHERE s."clientId" IS NOT NULL
					AND s."status" <> 'CANCELLED'
				GROUP BY s."clientId"
			)
		`;

		const filters = Prisma.sql`
			WHERE (${searchLike} IS NULL
				OR c."code" ILIKE ${searchLike}
				OR c."name" ILIKE ${searchLike}
				OR COALESCE(c."phone", '') ILIKE ${searchLike}
				OR COALESCE(c."email", '') ILIKE ${searchLike})
				AND (${query.status ?? null} IS NULL OR c."status" = CAST(${query.status ?? null} AS "EntityStatus"))
				AND ${accountTypeCondition}
				AND ${settledCondition}
				AND ABS(COALESCE(c."balance", 0)) >= ${minAmount}
		`;

		const [rows, totalRows] = await Promise.all([
			this.prisma.$queryRaw<
				Array<{
					clientId: string;
					code: string;
					name: string;
					phone: string | null;
					email: string | null;
					status: string;
					netBalance: number;
					currentDebt: number;
					currentAdvance: number;
					accountType: 'DEBT' | 'ADVANCE' | 'SETTLED';
					salesCount: number;
					totalPurchased: number;
					totalPaid: number;
					outstandingSalesDebt: number;
					lastSaleAt: Date | null;
					lastPaymentAt: Date | null;
				}>
			>(Prisma.sql`
				${baseQuery}
				SELECT
					c."id" AS "clientId",
					c."code",
					c."name",
					c."phone",
					c."email",
					c."status"::text AS "status",
					COALESCE(c."balance", 0)::float8 AS "netBalance",
					CASE WHEN COALESCE(c."balance", 0) < 0 THEN ABS(c."balance")::float8 ELSE 0 END AS "currentDebt",
					CASE WHEN COALESCE(c."balance", 0) > 0 THEN c."balance"::float8 ELSE 0 END AS "currentAdvance",
					CASE
						WHEN COALESCE(c."balance", 0) < 0 THEN 'DEBT'
						WHEN COALESCE(c."balance", 0) > 0 THEN 'ADVANCE'
						ELSE 'SETTLED'
					END AS "accountType",
					COALESCE(ss."salesCount", 0)::int AS "salesCount",
					COALESCE(ss."totalPurchased", 0)::float8 AS "totalPurchased",
					COALESCE(ss."totalPaid", 0)::float8 AS "totalPaid",
					COALESCE(ss."outstandingSalesDebt", 0)::float8 AS "outstandingSalesDebt",
					ss."lastSaleAt",
					ps."lastPaymentAt"
				FROM "Client" c
				LEFT JOIN sale_summary ss ON ss."clientId" = c."id"
				LEFT JOIN payment_summary ps ON ps."clientId" = c."id"
				${filters}
				ORDER BY ${orderClause}
				LIMIT ${limit}
				OFFSET ${skip}
			`),
			this.prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
				${baseQuery}
				SELECT COUNT(*)::bigint AS total
				FROM "Client" c
				LEFT JOIN sale_summary ss ON ss."clientId" = c."id"
				LEFT JOIN payment_summary ps ON ps."clientId" = c."id"
				${filters}
			`),
		]);

		return {
			data: rows.map((row) => ({
				...row,
				netBalance: this.toNumber(row.netBalance),
				currentDebt: this.toNumber(row.currentDebt),
				currentAdvance: this.toNumber(row.currentAdvance),
				totalPurchased: this.toNumber(row.totalPurchased),
				totalPaid: this.toNumber(row.totalPaid),
				outstandingSalesDebt: this.toNumber(row.outstandingSalesDebt),
			})),
			meta: {
				page,
				limit,
				total: Number(totalRows[0]?.total ?? 0),
			},
		};
	}

	async create(dto: CreateClientDto) {
		const client = await this.prisma.client.create({
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

		return { data: client };
	}

	async findOne(id: string) {
		const client = await this.prisma.client.findUnique({
			where: { id },
			include: {
				sales: {
					where: {
						status: {
							not: 'CANCELLED',
						},
					},
					orderBy: { soldAt: 'desc' },
					take: 5,
					include: {
						items: {
							select: {
								id: true,
								productId: true,
								quantity: true,
								unitPrice: true,
								lineTotal: true,
								product: {
									select: {
										id: true,
										sku: true,
										name: true,
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
							orderBy: { paidAt: 'desc' },
						},
					},
				},
			},
		});
		if (!client) {
			throw new NotFoundException('Client not found');
		}

		const totals = await this.prisma.sale.aggregate({
			where: {
				clientId: id,
				status: {
					not: 'CANCELLED',
				},
			},
			_sum: {
				total: true,
				paidAmount: true,
				remainingAmount: true,
			},
			_count: { _all: true },
		});

		return {
			data: {
				id: client.id,
				code: client.code,
				name: client.name,
				phone: client.phone,
				email: client.email,
				address: client.address,
				status: client.status,
				balance: client.balance,
				createdAt: client.createdAt,
				updatedAt: client.updatedAt,
				summary: {
					salesCount: totals._count._all,
					totalPurchased: Number(totals._sum.total ?? 0),
					totalPaid: Number(totals._sum.paidAmount ?? 0),
					totalOutstanding: Number(totals._sum.remainingAmount ?? 0),
				},
				recentPurchases: client.sales,
			},
		};
	}

	async update(id: string, dto: UpdateClientDto) {
		await this.findOne(id);
		const client = await this.prisma.client.update({
			where: { id },
			data: dto,
		});
		return { data: client };
	}

	async remove(id: string) {
		await this.findOne(id);
		await this.prisma.client.delete({ where: { id } });
		return { data: { id } };
	}
}
