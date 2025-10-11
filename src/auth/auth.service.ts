import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  // Registar novo utilizador
  async signup(email: string, name: string, password: string) {
    const existing = await this.users.findByEmail(email);
    if (existing) throw new UnauthorizedException('Email já em uso');

    const user = await this.users.create(email, name, password);
    return this.generateTokens(user.id, user.email);
  }

  // Login normal
  async login(email: string, password: string) {
    const user = await this.users.validate(email, password);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    return this.generateTokens(user.id, user.email);
  }

  // Refresh token
  async refresh(userId: string, email: string) {
    return this.generateTokens(userId, email);
  }

  // Geração de tokens de acesso e refresh
  private async generateTokens(sub: string, email: string) {
    const accessPayload = { sub, email };
    const refreshPayload = { sub, email };

    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret',
      expiresIn: (process.env.JWT_ACCESS_EXPIRES ?? '15m') as any,
    });

    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret: process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret',
      expiresIn: (process.env.JWT_REFRESH_EXPIRES ?? '7d') as any,
    });

    return { accessToken, refreshToken };
  }
}
