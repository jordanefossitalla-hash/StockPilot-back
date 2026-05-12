import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
		private readonly prisma: PrismaService,
	) {}

	async login(dto: LoginDto) {
		const user = await this.usersService.findByEmail(dto.email);
		if (!user || !user.isActive) {
			throw new UnauthorizedException('Invalid credentials');
		}

		const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
		if (!passwordValid) {
			throw new UnauthorizedException('Invalid credentials');
		}

		const tokens = await this.issueTokens(user.id, user.email, user.role);
		await this.storeRefreshToken(user.id, tokens.refreshToken);

		return {
			...tokens,
			user: {
				id: user.id,
				email: user.email,
				role: user.role,
				isActive: user.isActive,
			},
		};
	}

	async refresh(refreshToken: string) {
		const tokenRow = await this.prisma.refreshToken.findUnique({
			where: { token: refreshToken },
			include: { user: true },
		});

		if (!tokenRow || tokenRow.revokedAt || tokenRow.expiresAt < new Date()) {
			throw new UnauthorizedException('Invalid refresh token');
		}

		await this.prisma.refreshToken.update({
			where: { id: tokenRow.id },
			data: { revokedAt: new Date() },
		});

		const tokens = await this.issueTokens(
			tokenRow.user.id,
			tokenRow.user.email,
			tokenRow.user.role,
		);
		await this.storeRefreshToken(tokenRow.user.id, tokens.refreshToken);

		return tokens;
	}

	async logout(refreshToken: string) {
		await this.prisma.refreshToken.updateMany({
			where: { token: refreshToken, revokedAt: null },
			data: { revokedAt: new Date() },
		});
	}

	async me(userId: string) {
		const user = await this.usersService.findById(userId);
		if (!user) {
			throw new UnauthorizedException('User not found');
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

	private async issueTokens(userId: string, email: string, role: string) {
		const payload: { sub: string; email: string; role: string } = {
			sub: userId,
			email,
			role,
		};
		const accessToken = await this.jwtService.signAsync(payload);
		const refreshToken = await this.jwtService.signAsync(payload, {
			expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as unknown as number,
			secret: process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret',
		});

		return { accessToken, refreshToken };
	}

	private async storeRefreshToken(userId: string, token: string) {
		await this.prisma.refreshToken.create({
			data: {
				userId,
				token,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			},
		});
	}
}
