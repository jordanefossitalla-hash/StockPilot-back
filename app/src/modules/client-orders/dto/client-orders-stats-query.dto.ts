import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ClientOrdersStatsQueryDto {
  @ApiPropertyOptional({
    description: 'Filtre optionnel pour calculer les stats d un client precis.',
    example: '8f1fce75-6bcc-4fba-a95c-b3a300e265fd',
  })
  @IsOptional()
  @IsString()
  clientId?: string;
}
