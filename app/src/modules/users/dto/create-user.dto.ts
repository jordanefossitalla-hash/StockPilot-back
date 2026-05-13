import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export enum UserRoleDto {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  AGENT = 'AGENT',
}

export class CreateUserDto {
  @ApiProperty({
    example: '+33612345678',
    description: 'Numero de telephone du compte.',
  })
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/)
  phone!: string;

  @ApiProperty({ example: 'StrongPass123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ enum: UserRoleDto, example: UserRoleDto.AGENT })
  @IsEnum(UserRoleDto)
  role!: UserRoleDto;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
