import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListCategoriesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      status: query.status,
      OR: query.search
        ? [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            { description: { contains: query.search, mode: 'insensitive' as const } },
          ]
        : undefined,
    };

    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data: data.map(({ _count, ...category }) => ({
        ...category,
        productCount: _count.products,
      })),
      meta: { page, limit, total },
    };
  }

  async create(dto: CreateCategoryDto) {
    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return {
      data: {
        id: category.id,
        name: category.name,
        description: category.description,
        status: category.status,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        productCount: category._count.products,
      },
    };
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      data: {
        id: category.id,
        name: category.name,
        description: category.description,
        status: category.status,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        productCount: category._count.products,
      },
    };
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    const category = await this.prisma.category.update({
      where: { id },
      data: dto,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return {
      data: {
        id: category.id,
        name: category.name,
        description: category.description,
        status: category.status,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        productCount: category._count.products,
      },
    };
  }

  async remove(id: string) {
    const category = await this.findOne(id);

    if (category.data.productCount > 0) {
      throw new BadRequestException('Category cannot be deleted while products are attached');
    }

    await this.prisma.category.delete({ where: { id } });

    return { data: { id } };
  }
}