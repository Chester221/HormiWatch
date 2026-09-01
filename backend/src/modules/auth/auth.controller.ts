import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import type { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
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
      throw new UnauthorizedException('Invalid credentials');
    }
    const loginData = await this.authService.login(user);

    // Set Refresh Token in HttpOnly Cookie
    response.cookie('refresh_token', loginData.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

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
      throw new UnauthorizedException('Refresh token is required');
    }

    const newTokens = await this.authService.refreshToken(refreshToken);

    // Update Refresh Token Cookie
    response.cookie('refresh_token', newTokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken: newTokens.accessToken,
    };
  }
}
