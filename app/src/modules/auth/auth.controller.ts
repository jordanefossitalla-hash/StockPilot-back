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
	@ApiOkResponse({ description: 'Connexion reussie. Retourne accessToken + refreshToken.' })
	@ApiUnauthorizedResponse({ description: 'Identifiants invalides.' })
	@ApiBadRequestResponse({ description: 'Payload invalide.' })
	login(@Body() dto: LoginDto) {
		return this.authService.login(dto);
	}

	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Rafraichir la session' })
	@ApiOkResponse({ description: 'Nouveaux tokens emis.' })
	@ApiUnauthorizedResponse({ description: 'Refresh token invalide ou expire.' })
	refresh(@Body() dto: RefreshTokenDto) {
		return this.authService.refresh(dto.refreshToken);
	}

	@Post('logout')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Deconnexion' })
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
