import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { addMinutes, isAfter } from 'date-fns';

function random6() {
  // 6 dígitos, com zeros à esquerda
  return Math.floor(100000 + Math.random() * 900000).toString();
}

@Injectable()
export class NucsService {
  constructor(
    private prisma: PrismaService,
    private cfg: ConfigService,
    private jwt: JwtService,
  ) {}

  async generateClaimCode(farmId: string) {
    // confirma que a farm existe
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) throw new NotFoundException('Farm não encontrada');

    const ttl = Number(this.cfg.get('CLAIM_CODE_TTL_MINUTES') ?? 10);
    const claimCode = random6();
    const claimCodeHash = await bcrypt.hash(claimCode, 10);
    const claimCodeExpiresAt = addMinutes(new Date(), ttl);

    // cria (ou reusa) um registo NUC PENDENTE para esta farm
    // estratégia simples: cria sempre um novo registo pendente
    const nuc = await this.prisma.nuc.create({
      data: {
        farmId,
        status: 'offline',
        claimCodeHash,
        claimCodeExpiresAt,
      },
      select: { id: true, claimCodeExpiresAt: true },
    });

    return { nucId: nuc.id, claimCode, expiresAt: nuc.claimCodeExpiresAt };
  }

  async claimNuc(claimCode: string, deviceFingerprint: string, agentVersion?: string, endpoint?: string) {
    // encontrar um NUC pendente cujo claimCode hash case e não expirado
    const candidates = await this.prisma.nuc.findMany({
      where: {
        claimCodeHash: { not: null },
        claimCodeExpiresAt: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    let found = null as null | (typeof candidates)[number];
    for (const c of candidates) {
      if (!c.claimCodeHash || !c.claimCodeExpiresAt) continue;
      if (isAfter(new Date(), c.claimCodeExpiresAt)) continue;
      const ok = await bcrypt.compare(claimCode, c.claimCodeHash);
      if (ok) { found = c; break; }
    }

    if (!found) throw new BadRequestException('Código inválido ou expirado');

    // “reclama” o NUC: limpa o claim, atualiza info básica
    const updated = await this.prisma.nuc.update({
      where: { id: found.id },
      data: {
        claimCodeHash: null,
        claimCodeExpiresAt: null,
        status: 'offline',
        lastHeartbeat: new Date(),
        agentVersion: agentVersion ?? found.agentVersion,
        endpoint: endpoint ?? found.endpoint,
        name: found.name ?? 'NUC',
      },
    });

    // emitir agent token (JWT) com sub = nucId e "type":"agent"
    const token = await this.jwt.signAsync({
      sub: updated.id,
      type: 'agent',
      fp: deviceFingerprint,
    });

    // podes devolver MQTT/WS URL do .env ou por farm
    const mqttUrl = process.env.MQTT_URL ?? 'mqtt://mqtt:1883';

    return {
      nucId: updated.id,
      farmId: updated.farmId,
      agentToken: token,
      mqttUrl,
    };
  }

  async getFarmNuc(farmId: string) {
    const nuc = await this.prisma.nuc.findFirst({
      where: { farmId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, status: true, lastHeartbeat: true, agentVersion: true, endpoint: true, farmId: true,
      },
    });
    if (!nuc) throw new NotFoundException('Nenhum NUC associado a esta farm');
    return nuc;
  }

  async heartbeat(agentNucId: string, body: { agentVersion?: string }) {
    await this.prisma.nuc.update({
      where: { id: agentNucId },
      data: {
        lastHeartbeat: new Date(),
        status: 'online',
        agentVersion: body.agentVersion,
      },
    });
    return { ok: true };
  }
}