import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

    const where: Prisma.CategoryWhereInput = {
      status: query.status,
      OR: query.search
        ? [
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data: categories.map((category) => this.serializeCategory(category)),
      meta: { page, limit, total },
    };
  }

  async create(dto: CreateCategoryDto) {
    try {
      const category = await this.prisma.category.create({
        data: {
          name: dto.name,
          description: dto.description,
          status: dto.status,
        },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      return { data: this.serializeCategory(category) };
    } catch (error) {
      this.handleKnownPrismaError(error, 'A category with this name already exists');
    }
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return { data: this.serializeCategory(category) };
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    try {
      const category = await this.prisma.category.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          status: dto.status,
        },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      return { data: this.serializeCategory(category) };
    } catch (error) {
      this.handleKnownPrismaError(error, 'A category with this name already exists');
    }
  }

  async remove(id: string) {
    const category = await this.findOne(id);

    if (category.data.productsCount > 0) {
      throw new BadRequestException(
        'Cannot delete a category that still has attached products',
      );
    }

    await this.prisma.category.delete({ where: { id } });
    return { data: { id } };
  }

  private serializeCategory(
    category: Prisma.CategoryGetPayload<{
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    }>,
  ) {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      status: category.status,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      productsCount: category._count.products,
    };
  }

  private handleKnownPrismaError(error: unknown, duplicateNameMessage: string): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(duplicateNameMessage);
    }

    throw error;
  }
}