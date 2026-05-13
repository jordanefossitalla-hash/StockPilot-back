import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
	constructor(private readonly prisma: PrismaService) {}

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
		const client = await this.prisma.client.findUnique({ where: { id } });
		if (!client) {
			throw new NotFoundException('Client not found');
		}
		return { data: client };
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
