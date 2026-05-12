import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
	constructor(private readonly prisma: PrismaService) {}

	async findAll(query: ListProductsQueryDto) {
		const page = query.page ?? 1;
		const limit = query.limit ?? 20;
		const skip = (page - 1) * limit;

		const where = {
			name: query.search
				? { contains: query.search, mode: 'insensitive' as const }
				: undefined,
			categoryId: query.category,
			status: query.status,
		};

		const [data, total] = await Promise.all([
			this.prisma.product.findMany({
				where,
				skip,
				take: limit,
				orderBy: { createdAt: 'desc' },
			}),
			this.prisma.product.count({ where }),
		]);

		return {
			data,
			meta: { page, limit, total },
		};
	}

	async create(dto: CreateProductDto) {
		const product = await this.prisma.product.create({
			data: {
				sku: dto.sku,
				name: dto.name,
				categoryId: dto.categoryId,
				costPrice: dto.costPrice,
				salePrice: dto.salePrice,
				stockQuantity: dto.stockQuantity ?? 0,
				stockMinThreshold: dto.stockMinThreshold ?? 0,
				status: dto.status,
			},
		});
		return { data: product };
	}

	async findOne(id: string) {
		const product = await this.prisma.product.findUnique({ where: { id } });
		if (!product) {
			throw new NotFoundException('Product not found');
		}
		return { data: product };
	}

	async update(id: string, dto: UpdateProductDto) {
		await this.findOne(id);
		const product = await this.prisma.product.update({
			where: { id },
			data: dto,
		});
		return { data: product };
	}

	async remove(id: string) {
		await this.findOne(id);
		await this.prisma.product.delete({ where: { id } });
		return { data: { id } };
	}
}
