import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBody,
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiConflictResponse,
	ApiCreatedResponse,
	ApiNoContentResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	@ApiOperation({
		summary: 'Creer un compte',
		description: 'Inscription d\'un utilisateur avec numero de telephone et mot de passe.',
	})
	@ApiBody({
		description: 'Payload de creation de compte.',
		type: RegisterDto,
		examples: {
			default: {
				summary: 'Creation standard',
				value: {
					phone: '+33612345678',
					password: 'StrongPass123',
					role: 'ADMIN',
				},
			},
		},
	})
	@ApiCreatedResponse({
		description: 'Compte cree avec succes.',
	})
	@ApiConflictResponse({ description: 'Numero de telephone deja utilise.' })
	@ApiBadRequestResponse({ description: 'Payload invalide.' })
	register(@Body() dto: RegisterDto) {
		return this.authService.register(dto);
	}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: 'Connexion',
		description: 'Authentifie un utilisateur via numero de telephone + mot de passe.',
	})
	@ApiBody({
		description: 'Payload de connexion.',
		type: LoginDto,
		examples: {
			default: {
				summary: 'Connexion standard',
				value: {
					phone: '+33612345678',
					password: 'StrongPass123',
				},
			},
		},
	})
	@ApiOkResponse({ description: 'Connexion reussie. Retourne accessToken + refreshToken.' })
	@ApiUnauthorizedResponse({ description: 'Identifiants invalides.' })
	@ApiBadRequestResponse({ description: 'Payload invalide.' })
	login(@Body() dto: LoginDto) {
		return this.authService.login(dto);
	}

	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Rafraichir la session' })
	@ApiBody({
		description: 'Refresh token actif a echanger contre une nouvelle paire de tokens.',
		type: RefreshTokenDto,
		examples: {
			default: {
				summary: 'Refresh token',
				value: {
					refreshToken: 'eyJhbGciOiJI...refresh',
				},
			},
		},
	})
	@ApiOkResponse({ description: 'Nouveaux tokens emis.' })
	@ApiUnauthorizedResponse({ description: 'Refresh token invalide ou expire.' })
	refresh(@Body() dto: RefreshTokenDto) {
		return this.authService.refresh(dto.refreshToken);
	}

	@Post('logout')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Deconnexion' })
	@ApiBody({
		description: 'Refresh token a invalider.',
		type: RefreshTokenDto,
		examples: {
			default: {
				summary: 'Deconnexion',
				value: {
					refreshToken: 'eyJhbGciOiJI...refresh',
				},
			},
		},
	})
	@ApiNoContentResponse({ description: 'Session invalidee.' })
	logout(@Body() dto: RefreshTokenDto) {
		return this.authService.logout(dto.refreshToken);
	}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('access-token')
	@ApiOperation({
		summary: 'Profil courant',
		description: 'Necessite un accessToken Bearer valide (pas le refreshToken).',
	})
	@ApiOkResponse({ description: 'Informations du compte authentifie.' })
	@ApiUnauthorizedResponse({
		description: 'Access token invalide/expire ou refresh token utilise par erreur.',
	})
	me(@Req() req: Request & { user?: { sub: string } }) {
		return this.authService.me(req.user?.sub ?? '');
	}
}
