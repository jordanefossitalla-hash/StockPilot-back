import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
	constructor(private readonly prisma: PrismaService) {}

	async findAll(query: ListUsersQueryDto) {
		const page = query.page ?? 1;
		const limit = query.limit ?? 20;
		const skip = (page - 1) * limit;

		const [data, total] = await Promise.all([
			this.prisma.user.findMany({
				where: {
					deletedAt: null,
					email: query.search
						? { contains: query.search, mode: 'insensitive' }
						: undefined,
				},
				skip,
				take: limit,
				orderBy: { createdAt: 'desc' },
			}),
			this.prisma.user.count({
				where: {
					deletedAt: null,
					email: query.search
						? { contains: query.search, mode: 'insensitive' }
						: undefined,
				},
			}),
		]);

		return {
			data: data.map((u: { id: string; email: string; role: string; isActive: boolean; createdAt: Date }) => ({
				id: u.id,
				email: u.email,
				role: u.role,
				isActive: u.isActive,
				createdAt: u.createdAt,
			})),
			meta: { page, limit, total },
		};
	}

	async create(dto: CreateUserDto) {
		const passwordHash = await bcrypt.hash(dto.password, 10);
		const user = await this.prisma.user.create({
			data: {
				email: dto.email,
				passwordHash,
				role: dto.role,
				isActive: dto.isActive ?? true,
			},
		});

		return {
			data: {
				id: user.id,
				email: user.email,
				role: user.role,
				isActive: user.isActive,
			},
		};
	}

	async findOne(id: string) {
		const user = await this.findById(id);
		if (!user) {
			throw new NotFoundException('User not found');
		}

		return {
			data: {
				id: user.id,
				email: user.email,
				role: user.role,
				isActive: user.isActive,
			},
		};
	}

	async update(id: string, dto: UpdateUserDto) {
		await this.findOne(id);
		const data: {
			email?: string;
			role?: 'ADMIN' | 'MANAGER' | 'AGENT';
			isActive?: boolean;
			passwordHash?: string;
		} = {
			email: dto.email,
			role: dto.role,
			isActive: dto.isActive,
		};

		if (dto.password) {
			data.passwordHash = await bcrypt.hash(dto.password, 10);
		}

		const user = await this.prisma.user.update({
			where: { id },
			data,
		});

		return {
			data: {
				id: user.id,
				email: user.email,
				role: user.role,
				isActive: user.isActive,
			},
		};
	}

	async remove(id: string) {
		await this.findOne(id);
		await this.prisma.user.update({
			where: { id },
			data: { deletedAt: new Date() },
		});

		return { data: { id } };
	}

	findByEmail(email: string) {
		return this.prisma.user.findFirst({
			where: { email, deletedAt: null },
		});
	}

	findById(id: string) {
		return this.prisma.user.findFirst({
			where: { id, deletedAt: null },
		});
	}
}
