import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsBoolean,
	IsEnum,
	IsInt,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	Min,
} from 'class-validator';
import { ClientStatusDto } from './create-client.dto';

export enum ClientAccountTypeDto {
	ALL = 'ALL',
	DEBT = 'DEBT',
	ADVANCE = 'ADVANCE',
	SETTLED = 'SETTLED',
}

export enum ClientAccountSortByDto {
	AMOUNT = 'amount',
	LAST_SALE_AT = 'lastSaleAt',
	NAME = 'name',
	CODE = 'code',
}

export enum ClientAccountSortOrderDto {
	ASC = 'asc',
	DESC = 'desc',
}

export class ListClientAccountStatusQueryDto {
	@ApiPropertyOptional({
		example: 'melen',
		description: 'Recherche partielle sur le code, nom, telephone ou email.',
	})
	@IsOptional()
	@IsString()
	search?: string;

	@ApiPropertyOptional({
		enum: ClientStatusDto,
		example: ClientStatusDto.ACTIVE,
		description: 'Filtrer les clients par statut.',
	})
	@IsOptional()
	@IsEnum(ClientStatusDto)
	status?: ClientStatusDto;

	@ApiPropertyOptional({
		enum: ClientAccountTypeDto,
		example: ClientAccountTypeDto.ALL,
		description:
			'Type de compte a retourner. ALL renvoie dettes et avances. SETTLED ne renvoie que les soldes nuls.',
	})
	@IsOptional()
	@IsEnum(ClientAccountTypeDto)
	accountType?: ClientAccountTypeDto = ClientAccountTypeDto.ALL;

	@ApiPropertyOptional({
		example: false,
		description:
			'Quand false, exclut les clients soldes. Quand true, peut inclure les comptes a zero si accountType=ALL.',
	})
	@IsOptional()
	@Type(() => Boolean)
	@IsBoolean()
	includeSettled?: boolean = false;

	@ApiPropertyOptional({
		example: 10000,
		description: 'Montant minimum absolu du solde net a retourner.',
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	minAmount?: number;

	@ApiPropertyOptional({
		enum: ClientAccountSortByDto,
		example: ClientAccountSortByDto.AMOUNT,
		description: 'Champ de tri principal.',
	})
	@IsOptional()
	@IsEnum(ClientAccountSortByDto)
	sortBy?: ClientAccountSortByDto = ClientAccountSortByDto.AMOUNT;

	@ApiPropertyOptional({
		enum: ClientAccountSortOrderDto,
		example: ClientAccountSortOrderDto.DESC,
		description: 'Sens du tri.',
	})
	@IsOptional()
	@IsEnum(ClientAccountSortOrderDto)
	sortOrder?: ClientAccountSortOrderDto = ClientAccountSortOrderDto.DESC;

	@ApiPropertyOptional({
		example: 1,
		minimum: 1,
		description: 'Numero de page.',
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number = 1;

	@ApiPropertyOptional({
		example: 20,
		minimum: 1,
		maximum: 100,
		description: 'Taille de page.',
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number = 20;
}