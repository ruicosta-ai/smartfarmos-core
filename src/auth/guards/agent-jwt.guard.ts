import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AgentJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) throw new UnauthorizedException('Token de agente ausente');

    try {
      // Usa o segredo dos agentes (AGENT_JWT_SECRET)
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.AGENT_JWT_SECRET,
      });
      req.user = payload; // injeta { sub: nucId, type: 'agent', ... }
      return true;
    } catch {
      throw new UnauthorizedException('Token de agente inválido ou expirado');
    }
  }
}