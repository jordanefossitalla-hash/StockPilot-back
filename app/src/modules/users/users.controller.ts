import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
	ApiBody,
	ApiCreatedResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get()
	@ApiOperation({ summary: 'Lister les utilisateurs' })
	@ApiOkResponse({
		description: 'Liste paginee des utilisateurs.',
		example: {
			data: [
				{
					id: '6f4a46fe-cb9d-4cf5-8e14-f335636f594e',
					email: '+237695947075',
					role: 'AGENT',
					isActive: true,
					createdAt: '2026-05-18T10:00:00.000Z',
				},
			],
			meta: { page: 1, limit: 20, total: 1 },
		},
	})
	findAll(@Query() query: ListUsersQueryDto) {
		return this.usersService.findAll(query);
	}

	@Post()
	@ApiOperation({ summary: 'Creer un utilisateur' })
	@ApiBody({
		description: 'Payload de creation utilisateur.',
		type: CreateUserDto,
		examples: {
			agent: {
				summary: 'Creation d\'un agent',
				value: {
					phone: '+237695947075',
					password: 'StrongPass123',
					role: 'AGENT',
					isActive: true,
				},
			},
			manager: {
				summary: 'Creation d\'un manager',
				value: {
					phone: '+33612345678',
					password: 'StrongPass123',
					role: 'MANAGER',
					isActive: true,
				},
			},
		},
	})
	@ApiCreatedResponse({
		description: 'Utilisateur cree avec succes.',
		example: {
			data: {
				id: '6f4a46fe-cb9d-4cf5-8e14-f335636f594e',
				email: '+237695947075',
				role: 'AGENT',
				isActive: true,
			},
		},
	})
	create(@Body() dto: CreateUserDto) {
		return this.usersService.create(dto);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Recuperer un utilisateur' })
	@ApiParam({ name: 'id', description: 'Identifiant UUID de l\'utilisateur' })
	@ApiOkResponse({
		description: 'Detail utilisateur.',
		example: {
			data: {
				id: '6f4a46fe-cb9d-4cf5-8e14-f335636f594e',
				email: '+237695947075',
				role: 'AGENT',
				isActive: true,
				createdAt: '2026-05-18T10:00:00.000Z',
				updatedAt: '2026-05-18T10:00:00.000Z',
			},
		},
	})
	findOne(@Param('id') id: string) {
		return this.usersService.findOne(id);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Mettre a jour un utilisateur' })
	@ApiParam({ name: 'id', description: 'Identifiant UUID de l\'utilisateur' })
	@ApiBody({
		description: 'Payload de mise a jour partielle.',
		type: UpdateUserDto,
		examples: {
			role: {
				summary: 'Changer le role',
				value: { role: 'MANAGER' },
			},
			activation: {
				summary: 'Desactiver un compte',
				value: { isActive: false },
			},
		},
	})
	@ApiOkResponse({
		description: 'Utilisateur mis a jour.',
		example: {
			data: {
				id: '6f4a46fe-cb9d-4cf5-8e14-f335636f594e',
				email: '+237695947075',
				role: 'MANAGER',
				isActive: true,
			},
		},
	})
	update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
		return this.usersService.update(id, dto);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Supprimer (soft delete) un utilisateur' })
	@ApiParam({ name: 'id', description: 'Identifiant UUID de l\'utilisateur' })
	@ApiOkResponse({
		description: 'Utilisateur supprime.',
		example: {
			data: {
				id: '6f4a46fe-cb9d-4cf5-8e14-f335636f594e',
			},
		},
	})
	remove(@Param('id') id: string) {
		return this.usersService.remove(id);
	}
}
