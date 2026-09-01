import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { HashingService } from '../../common/hashing/hashing.service';
import { User } from '../users/entities/user.entity';
import { IJwtPayload } from './interface/payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly hashingService: HashingService,
  ) {}

  async login(user: User) {
    const payload = { sub: user.id, role: user.role.name };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' }); // Generate Refresh Token

    // Update last connection and set refresh token asynchronously
    await Promise.all([
      this.usersService.updateLastConnection(user.id),
      this.usersService.setCurrentRefreshToken(user.id, refreshToken),
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role.name,
        name: user.profile?.name,
        lastName: user.profile?.lastName,
      },
    };
  }

  async logout(userId: string) {
    await this.usersService.removeRefreshToken(userId);
    return { message: 'Logged out successfully' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<IJwtPayload>(refreshToken);
      const validUser = await this.usersService.getUserIfRefreshTokenMatches(
        payload.sub,
        refreshToken,
      );

      if (!validUser) {
        throw new UnauthorizedException('Invalid Refresh Token');
      }

      const newPayload = { sub: validUser.id, role: validUser.role.name };
      const newAccessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: '7d',
      });

      // Rotate Refresh Token and update last connection
      await Promise.all([
        this.usersService.updateLastConnection(validUser.id),
        this.usersService.setCurrentRefreshToken(validUser.id, newRefreshToken),
      ]);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired Refresh Token');
    }
  }

  // Helper method to validate user (typically used by LocalStrategy if we had one, or manual login)
  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.usersService.findOneByEmailForAuth(email);
    if (user && (await this.hashingService.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result as User;
    }
    return null;
  }
}
