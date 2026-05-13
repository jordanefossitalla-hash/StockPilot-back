import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
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
	@ApiOkResponse({ description: 'Liste paginee des utilisateurs.' })
	findAll(@Query() query: ListUsersQueryDto) {
		return this.usersService.findAll(query);
	}

	@Post()
	@ApiOperation({ summary: 'Creer un utilisateur' })
	@ApiCreatedResponse({ description: 'Utilisateur cree avec succes.' })
	create(@Body() dto: CreateUserDto) {
		return this.usersService.create(dto);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Recuperer un utilisateur' })
	@ApiParam({ name: 'id', description: 'Identifiant UUID de l\'utilisateur' })
	@ApiOkResponse({ description: 'Detail utilisateur.' })
	findOne(@Param('id') id: string) {
		return this.usersService.findOne(id);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Mettre a jour un utilisateur' })
	@ApiParam({ name: 'id', description: 'Identifiant UUID de l\'utilisateur' })
	@ApiOkResponse({ description: 'Utilisateur mis a jour.' })
	update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
		return this.usersService.update(id, dto);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Supprimer (soft delete) un utilisateur' })
	@ApiParam({ name: 'id', description: 'Identifiant UUID de l\'utilisateur' })
	@ApiOkResponse({ description: 'Utilisateur supprime.' })
	remove(@Param('id') id: string) {
		return this.usersService.remove(id);
	}
}
