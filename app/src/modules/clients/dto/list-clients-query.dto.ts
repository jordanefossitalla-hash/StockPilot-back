import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ClientStatusDto } from './create-client.dto';

export class ListClientsQueryDto {
  @ApiPropertyOptional({
    example: 'mboa',
    description: 'Recherche partielle sur le nom du client.',
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
    example: 1,
    minimum: 1,
    description: 'Numero de page (pagination).',
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
    description: 'Taille de page (1 a 100).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
