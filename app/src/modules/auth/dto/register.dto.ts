import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';

enum RegisterRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  AGENT = 'AGENT',
}

export class RegisterDto {
  @ApiProperty({
    example: '+33612345678',
    description: 'Numero de telephone unique du compte.',
  })
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/)
  phone!: string;

  @ApiProperty({
    example: 'StrongPass123',
    minLength: 6,
    description: 'Mot de passe du compte.',
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({
    description: 'Role force uniquement pour les usages internes.',
    enum: RegisterRole,
  })
  @IsOptional()
  @IsEnum(RegisterRole)
  role?: 'ADMIN' | 'MANAGER' | 'AGENT';
}
