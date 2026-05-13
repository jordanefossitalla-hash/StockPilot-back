import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_ACCESS_SECRET') ?? 'dev_access_secret',
    });
  }

  validate(payload: { sub: string; phone: string; role: string; tokenType?: 'access' | 'refresh' }) {
    if (payload.tokenType && payload.tokenType !== 'access') {
      throw new UnauthorizedException('Access token required');
    }

    return payload;
  }
}
