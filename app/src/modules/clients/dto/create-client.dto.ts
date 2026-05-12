import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export enum ClientStatusDto {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  WARNING = 'WARNING',
}

export class CreateClientDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(ClientStatusDto)
  status?: ClientStatusDto;
}
