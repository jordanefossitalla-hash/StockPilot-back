import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: '+33612345678',
    description: 'Numero de telephone du compte (format international recommande).',
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
}
