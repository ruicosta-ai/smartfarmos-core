// src/nucs/nucs.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

import { NucsService } from './nucs.service';
import { CreateClaimCodeDto, ClaimNucDto } from './dto/claim-code.dto';

@Controller()
export class NucsController {
  constructor(
    private readonly nucs: NucsService,
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
  ) {}

  // Utilizador autenticado gera claim code para uma farm
  @UseGuards(AuthGuard('jwt'))
  @Post('/nucs/claim-code')
  async createClaim(@Body() dto: CreateClaimCodeDto) {
    // service recebe apenas farmId (ajusta se o teu service tiver outra assinatura)
    return this.nucs.generateClaimCode(dto.farmId);
  }

  // Endpoint público para o NUC reclamar com o código
  @Post('/nucs/claim')
  async claim(@Body() dto: ClaimNucDto) {
    return this.nucs.claimNuc(
      dto.claimCode,
      dto.deviceFingerprint,
      dto.agentVersion,
      dto.endpoint,
    );
  }

  // Ver NUC associado à farm (user auth)
  @UseGuards(AuthGuard('jwt'))
  @Get('/farms/:id/nuc')
  async getByFarm(@Param('id') farmId: string) {
    return this.nucs.getFarmNuc(farmId);
  }

  // Heartbeat autenticado com agentToken (Bearer)
  @Post('/nucs/:id/heartbeat')
  async heartbeat(
    @Param('id') nucId: string,
    @Req() req: Request,
    @Body() body: { agentVersion?: string },
  ) {
    // validar agent token
    const auth = req.headers.authorization || '';
    const [, token] = auth.split(' ');
    if (!token) throw new UnauthorizedException('Agent token em falta');

    const agentSecret =
      this.cfg.get<string>('AGENT_JWT_SECRET') ||
      process.env.AGENT_JWT_SECRET ||
      process.env.JWT_ACCESS_SECRET ||
      'dev_agent_secret';

    const payload = await this.jwt.verifyAsync(token, { secret: agentSecret }).catch(() => null);
    if (!payload || (payload as any).type !== 'agent' || (payload as any).sub !== nucId) {
      throw new UnauthorizedException('Agent token inválido');
    }

    return this.nucs.heartbeat(nucId, { agentVersion: body?.agentVersion });
  }
}