import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { ListSuppliersQueryDto } from './dto/list-suppliers-query.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
	constructor(private readonly prisma: PrismaService) {}

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
}
