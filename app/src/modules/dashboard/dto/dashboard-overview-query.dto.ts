import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum DashboardGroupByDto {
	DAY = 'DAY',
	WEEK = 'WEEK',
	MONTH = 'MONTH',
}

export class DashboardOverviewQueryDto {
	@ApiPropertyOptional({
		description: 'Date minimale incluse pour les KPI et graphiques (ISO 8601).',
		example: '2026-05-01T00:00:00.000Z',
	})
	@IsOptional()
	@IsDateString()
	from?: string;

	@ApiPropertyOptional({
		description: 'Date maximale incluse pour les KPI et graphiques (ISO 8601).',
		example: '2026-05-31T23:59:59.999Z',
	})
	@IsOptional()
	@IsDateString()
	to?: string;

	@ApiPropertyOptional({
		enum: DashboardGroupByDto,
		description: 'Granularite des graphiques.',
		example: DashboardGroupByDto.DAY,
	})
	@IsOptional()
	@IsEnum(DashboardGroupByDto)
	groupBy?: DashboardGroupByDto = DashboardGroupByDto.DAY;
}