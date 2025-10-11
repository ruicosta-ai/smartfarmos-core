import { Body, Controller, Get, Param, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { NucsService } from './nucs.service';
import { CreateClaimCodeDto, ClaimNucDto } from './dto/claim-code.dto';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // já tens no projeto

@Controller()
export class NucsController {
  constructor(
    private readonly nucs: NucsService,
    private readonly jwt: JwtService,
  ) {}

  // Utilizador autenticado gera claim code para uma farm
  @UseGuards(JwtAuthGuard)
  @Post('/nucs/claim-code')
  async createClaim(@Body() dto: CreateClaimCodeDto) {
    return this.nucs.generateClaimCode(dto.farmId);
  }

  // Endpoint público para o NUC reclamar com o código
  @Post('/nucs/claim')
  async claim(@Body() dto: ClaimNucDto) {
    return this.nucs.claimNuc(dto.claimCode, dto.deviceFingerprint, dto.agentVersion, dto.endpoint);
  }

  // Ver NUC associado à farm (user auth)
  @UseGuards(JwtAuthGuard)
  @Get('/farms/:id/nuc')
  async getByFarm(@Param('id') farmId: string) {
    return this.nucs.getFarmNuc(farmId);
  }

  // Heartbeat autenticado com agentToken (Bearer)
  @Post('/nucs/:id/heartbeat')
  async heartbeat(@Param('id') nucId: string, @Req() req: Request, @Body() body: { agentVersion?: string }) {
    // validar agent token
    const auth = req.headers.authorization || '';
    const [, token] = auth.split(' ');
    if (!token) throw new UnauthorizedException('Agent token em falta');

    const payload = await this.jwt.verifyAsync(token).catch(() => null);
    if (!payload || payload.type !== 'agent' || payload.sub !== nucId) {
      throw new UnauthorizedException('Agent token inválido');
    }

    return this.nucs.heartbeat(nucId, { agentVersion: body?.agentVersion });
  }
}