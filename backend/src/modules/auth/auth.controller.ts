import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Query,
  UnauthorizedException,
  UseGuards,
  Request,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { IActiveUser } from './interface/payload.interface';
import { SkipAuth } from './decorator/skipAuth.decorator';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 🍪 Opciones de cookie según entorno:
  // PRODUCCIÓN (frontend en Vercel, backend en Railway = dominios distintos):
  //   sameSite 'none' + secure true → el navegador envía la cookie en peticiones cross-site.
  // LOCAL (http://localhost): 'lax' + sin Secure → Chrome rechaza SameSite=None sin Secure
  //   sobre HTTP, así que se degrada automáticamente.
  private buildRefreshCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  @SkipAuth()
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiOkResponse({
    description: 'Login successful, returns access token and user info',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const loginData = await this.authService.login(user);

    // Set Refresh Token in HttpOnly Cookie
    response.cookie('refresh_token', loginData.refreshToken, this.buildRefreshCookieOptions());

    return {
      accessToken: loginData.accessToken,
      user: loginData.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'User logout' })
  @ApiOkResponse({ description: 'Logout successful' })
  async logout(
    @Request() req: { user: IActiveUser },
    @Res({ passthrough: true }) response: Response,
  ) {
    response.clearCookie('refresh_token');
    return this.authService.logout(req.user.userId);
  }

  @Post('refresh')
  @SkipAuth()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiOkResponse({ description: 'New access token generated' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { refreshToken: { type: 'string' } },
    },
    required: false,
    description: 'Refresh token in body (optional, usually refers to cookie)',
  })
  async refresh(
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken: string | undefined =
      (req.cookies as Record<string, string>)['refresh_token'] ||
      (req.body as { refreshToken?: string })?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Token de refresco requerido');
    }

    const newTokens = await this.authService.refreshToken(refreshToken);

    // Update Refresh Token Cookie
    response.cookie('refresh_token', newTokens.refreshToken, this.buildRefreshCookieOptions());

    return {
      accessToken: newTokens.accessToken,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('account')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar la propia cuenta (force: ignora tareas/proyectos asociados)' })
  async deleteAccount(
    @Request() req: { user: IActiveUser },
    @Query('force') force?: string,
  ) {
    await this.authService.deleteAccount(req.user.userId, force === 'true');
  }

  @UseGuards(JwtAuthGuard)
  @Get('session')
  @ApiOperation({ summary: 'Get current session' })
  @ApiOkResponse({ description: 'Returns current user session data' })
  async getSession(@Request() req: { user: IActiveUser }) {
    return this.authService.getSession(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @ApiOperation({ summary: 'Cambiar la contraseña del usuario autenticado' })
  @ApiOkResponse({ description: 'Contraseña actualizada correctamente' })
  async changePassword(
    @Request() req: { user: IActiveUser },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.userId, changePasswordDto);
  }
}