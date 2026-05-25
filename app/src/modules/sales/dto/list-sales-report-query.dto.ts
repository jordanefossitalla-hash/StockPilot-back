import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { SaleStatusDto } from './list-sales-query.dto';

export enum SalesReportGroupByDto {
	DAY = 'DAY',
	WEEK = 'WEEK',
	MONTH = 'MONTH',
}

export class ListSalesReportQueryDto {
	@ApiPropertyOptional({
		description: 'Date minimale incluse de la periode (ISO 8601).',
		example: '2026-05-01T00:00:00.000Z',
	})
	@IsOptional()
	@IsDateString()
	from?: string;

	@ApiPropertyOptional({
		description: 'Date maximale incluse de la periode (ISO 8601).',
		example: '2026-05-31T23:59:59.999Z',
	})
	@IsOptional()
	@IsDateString()
	to?: string;

	@ApiPropertyOptional({
		description: 'Filtre optionnel sur un client precis.',
		example: '8f1fce75-6bcc-4fba-a95c-b3a300e265fd',
	})
	@IsOptional()
	@IsString()
	clientId?: string;

	@ApiPropertyOptional({
		description: 'Recherche sur code vente, nom client, SKU ou nom produit.',
		example: 'Terminal',
	})
	@IsOptional()
	@IsString()
	search?: string;

	@ApiPropertyOptional({
		enum: SaleStatusDto,
		description: 'Filtre optionnel sur un statut de vente precis.',
		example: SaleStatusDto.PAID,
	})
	@IsOptional()
	@IsEnum(SaleStatusDto)
	status?: SaleStatusDto;

	@ApiPropertyOptional({
		enum: SalesReportGroupByDto,
		description: 'Granularite de l evolution de performance.',
		example: SalesReportGroupByDto.DAY,
	})
	@IsOptional()
	@IsEnum(SalesReportGroupByDto)
	groupBy?: SalesReportGroupByDto = SalesReportGroupByDto.DAY;
}