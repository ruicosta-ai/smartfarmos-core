import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { addMinutes } from 'date-fns';

function random6() {
  // 6 dígitos, permitindo zeros à esquerda
  return Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
}

@Injectable()
export class NucsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cfg: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  async generateClaimCode(farmId: string) {
    // confirma que a farm existe
    const farm = await this.prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) throw new NotFoundException('Farm não encontrada');

    const ttl = Number(this.cfg.get('CLAIM_CODE_TTL_MINUTES') ?? 10);
    const claimCode = random6();
    const claimCodeHash = await bcrypt.hash(claimCode, 10);
    const claimCodeExpiresAt = addMinutes(new Date(), ttl);

    // 1:1 Farm↔NUC — se já existir NUC para a farm, apenas atualizar claim; senão criar
    const existing = await this.prisma.nuc.findUnique({
      where: { farmId }, // farmId é @@unique
      select: { id: true },
    });

    let nuc;
    if (existing) {
      nuc = await this.prisma.nuc.update({
        where: { id: existing.id },
        data: {
          claimCodeHash,
          claimCodeExpiresAt,
        },
        select: { id: true, claimCodeExpiresAt: true },
      });
    } else {
      nuc = await this.prisma.nuc.create({
        data: {
          farmId,
          status: 'offline',
          claimCodeHash,
          claimCodeExpiresAt,
        },
        select: { id: true, claimCodeExpiresAt: true },
      });
    }

    return { nucId: nuc.id, claimCode, expiresAt: nuc.claimCodeExpiresAt };
  }

  async claimNuc(claimCode: string, deviceFingerprint: string, agentVersion?: string, endpoint?: string) {
    try {
      // encontrar um NUC pendente cujo claimCode hash case e não expirado
      const candidates = await this.prisma.nuc.findMany({
        where: {
          claimCodeHash: { not: null },
          // apenas códigos ainda válidos
          claimCodeExpiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      let found = null as null | (typeof candidates)[number];
      for (const c of candidates) {
        if (!c.claimCodeHash) continue;
        const ok = await bcrypt.compare(claimCode, c.claimCodeHash);
        if (ok) { found = c; break; }
      }

      if (!found) throw new BadRequestException('Código inválido ou expirado');

      // “reclama” o NUC: limpa o claim, atualiza info básica
      const updated = await this.prisma.nuc.update({
        where: { id: found.id },
        data: {
          // limpar dados do claim
          claimCodeHash: null,
          claimCodeExpiresAt: null,
          // manter apenas campos estáveis garantidos no schema
          agentVersion: agentVersion ?? found.agentVersion,
          endpoint: endpoint ?? found.endpoint,
        },
      });

      const agentSecret =
        this.cfg.get<string>('AGENT_JWT_SECRET') ||
        process.env.AGENT_JWT_SECRET ||
        process.env.JWT_ACCESS_SECRET ||
        'dev_agent_secret';

      const expRaw =
        this.cfg.get<string>('AGENT_JWT_EXPIRES') ||
        process.env.AGENT_JWT_EXPIRES ||
        '90d';

      // Some jwt typings expect number | StringValue; allow numeric strings or duration strings ("90d")
      const expiresIn =
        typeof expRaw === 'string' && /^\d+$/.test(expRaw) ? Number(expRaw) : (expRaw as any);

      const token = await this.jwt.signAsync(
        {
          sub: updated.id,
          type: 'agent',
          fp: deviceFingerprint,
        },
        {
          secret: agentSecret,
          expiresIn,
        },
      );

      // podes devolver MQTT/WS URL do .env ou por farm
      const mqttUrl = this.cfg.get('MQTT_URL') ?? process.env.MQTT_URL ?? 'mqtt://mqtt:1883';

      return {
        nucId: updated.id,
        farmId: updated.farmId,
        agentToken: token,
        mqttUrl,
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[CLAIM_NUC_ERROR]', err);
      throw new BadRequestException('CLAIM_FAIL: ' + (err?.message || 'unknown'));
    }
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