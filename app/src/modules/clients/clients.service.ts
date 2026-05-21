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
		const minAmount = query.minAmount ?? 0;
		const includeSettled = query.includeSettled ?? false;
		const accountType = query.accountType ?? ClientAccountTypeDto.ALL;

		const where: Prisma.ClientWhereInput = {
			status: query.status,
			OR: query.search
				? [
						{ code: { contains: query.search, mode: 'insensitive' } },
						{ name: { contains: query.search, mode: 'insensitive' } },
						{ phone: { contains: query.search, mode: 'insensitive' } },
						{ email: { contains: query.search, mode: 'insensitive' } },
				  ]
				: undefined,
			AND: this.buildAccountStatusFilters(accountType, includeSettled, minAmount),
		};

		const clients = await this.prisma.client.findMany({
			where,
			select: {
				id: true,
				code: true,
				name: true,
				phone: true,
				email: true,
				status: true,
				balance: true,
			},
		});

		const clientIds = clients.map((client) => client.id);
		const [saleSummaries, payments] = clientIds.length
			? await Promise.all([
					this.prisma.sale.groupBy({
						by: ['clientId'],
						where: {
							clientId: { in: clientIds },
							status: { not: 'CANCELLED' },
						},
						_count: { _all: true },
						_sum: {
							total: true,
							paidAmount: true,
							remainingAmount: true,
						},
						_max: { soldAt: true },
					}),
					this.prisma.salePayment.findMany({
						where: {
							sale: {
								clientId: { in: clientIds },
								status: { not: 'CANCELLED' },
							},
						},
						select: {
							paidAt: true,
							sale: { select: { clientId: true } },
						},
						orderBy: { paidAt: 'desc' },
					}),
			  ])
			: [[], []];

		const saleSummaryMap = new Map(
			saleSummaries.map((summary) => [summary.clientId, summary]),
		);

		const lastPaymentByClient = new Map<string, Date>();
		for (const payment of payments) {
			const clientId = payment.sale.clientId;
			if (clientId && !lastPaymentByClient.has(clientId)) {
				lastPaymentByClient.set(clientId, payment.paidAt);
			}
		}

		const data = clients.map((client) => {
			const netBalance = this.toNumber(client.balance);
			const summary = saleSummaryMap.get(client.id);
			const currentDebt = netBalance < 0 ? Math.abs(netBalance) : 0;
			const currentAdvance = netBalance > 0 ? netBalance : 0;

			return {
				clientId: client.id,
				code: client.code,
				name: client.name,
				phone: client.phone,
				email: client.email,
				status: client.status,
				netBalance,
				currentDebt,
				currentAdvance,
				accountType:
					currentDebt > 0
						? 'DEBT'
						: currentAdvance > 0
							? 'ADVANCE'
							: 'SETTLED',
				salesCount: summary?._count._all ?? 0,
				totalPurchased: this.toNumber(summary?._sum.total),
				totalPaid: this.toNumber(summary?._sum.paidAmount),
				outstandingSalesDebt: this.toNumber(summary?._sum.remainingAmount),
				lastSaleAt: summary?._max.soldAt ?? null,
				lastPaymentAt: lastPaymentByClient.get(client.id) ?? null,
			};
		});

		const sortedData = data.sort((left, right) =>
			this.compareAccountStatusRows(
				left,
				right,
				query.sortBy ?? ClientAccountSortByDto.AMOUNT,
				query.sortOrder ?? ClientAccountSortOrderDto.DESC,
			),
		);

		return {
			data: sortedData.slice(skip, skip + limit),
			meta: {
				page,
				limit,
				total: sortedData.length,
			},
		};
	}

	private buildAccountStatusFilters(
		accountType: ClientAccountTypeDto,
		includeSettled: boolean,
		minAmount: number,
	): Prisma.ClientWhereInput[] | undefined {
		if (accountType === ClientAccountTypeDto.DEBT) {
			return [{ balance: { lte: -minAmount || -0.000001 } }];
		}

		if (accountType === ClientAccountTypeDto.ADVANCE) {
			return [{ balance: { gte: minAmount || 0.000001 } }];
		}

		if (accountType === ClientAccountTypeDto.SETTLED) {
			return [{ balance: 0 }];
		}

		if (includeSettled && minAmount <= 0) {
			return undefined;
		}

		if (includeSettled) {
			return [
				{
					OR: [
						{ balance: { lte: -minAmount } },
						{ balance: { gte: minAmount } },
						...(minAmount === 0 ? [{ balance: 0 }] : []),
					],
				},
			];
		}

		return [
			{
				OR: [
					{ balance: { lt: 0, lte: -minAmount } },
					{ balance: { gt: 0, gte: minAmount } },
				],
			},
		];
	}

	private compareAccountStatusRows(
		left: {
			name: string;
			code: string;
			netBalance: number;
			lastSaleAt: Date | null;
		},
		right: {
			name: string;
			code: string;
			netBalance: number;
			lastSaleAt: Date | null;
		},
		sortBy: ClientAccountSortByDto,
		sortOrder: ClientAccountSortOrderDto,
	) {
		const direction = sortOrder === ClientAccountSortOrderDto.ASC ? 1 : -1;

		if (sortBy === ClientAccountSortByDto.NAME) {
			return left.name.localeCompare(right.name) * direction;
		}

		if (sortBy === ClientAccountSortByDto.CODE) {
			return left.code.localeCompare(right.code) * direction;
		}

		if (sortBy === ClientAccountSortByDto.LAST_SALE_AT) {
			const leftTime = left.lastSaleAt?.getTime() ?? -Infinity;
			const rightTime = right.lastSaleAt?.getTime() ?? -Infinity;
			if (leftTime !== rightTime) {
				return (leftTime - rightTime) * direction;
			}
			return left.name.localeCompare(right.name);
		}

		const amountDiff = Math.abs(left.netBalance) - Math.abs(right.netBalance);
		if (amountDiff !== 0) {
			return amountDiff * direction;
		}

		return left.name.localeCompare(right.name);
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
