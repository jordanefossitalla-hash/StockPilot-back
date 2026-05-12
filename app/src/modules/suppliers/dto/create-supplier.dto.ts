import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export enum SupplierStatusDto {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  WARNING = 'WARNING',
}

export class CreateSupplierDto {
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
  @IsEnum(SupplierStatusDto)
  status?: SupplierStatusDto;
}
