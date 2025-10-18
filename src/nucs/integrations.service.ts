import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, IntegrationStatus, IntegrationKind } from '@prisma/client';

export type CreateIntegrationDto = {
  kind: IntegrationKind;
  name?: string;
  config?: Record<string, any>;
  secrets?: Record<string, any>; // TODO: cifrar + mascarar em respostas
  status?: IntegrationStatus;     // default: DISABLED
};

export type UpdateIntegrationDto = Partial<CreateIntegrationDto>;

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** garante que o utilizador tem acesso à farm do NUC */
  private async assertUserAccessToNuc(userId: string, nucId: string) {
    const nuc = await this.prisma.nuc.findUnique({
      where: { id: nucId },
      select: {
        id: true,
        farmId: true,
        farm: {
          select: {
            id: true,
            users: { select: { userId: true } },
          },
        },
      },
    });
    if (!nuc) throw new NotFoundException('NUC não encontrado');
    if (!nuc.farmId) throw new BadRequestException('NUC ainda não está associado a uma quinta');
    const isMember = nuc.farm?.users.some((u) => u.userId === userId);
    if (!isMember) throw new ForbiddenException('Sem acesso a esta quinta/NUC');
    return nuc;
  }

  async list(userId: string, nucId: string) {
    await this.assertUserAccessToNuc(userId, nucId);
    return this.prisma.nucIntegration.findMany({
      where: { nucId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** lista integrações ativas para o AGENTE (inclui segredos), filtradas por status */
  async listForAgent(nucId: string) {
    // Nota: validação de acesso deve ser feita no controller via AgentJwtGuard (sub === nucId)
    return this.prisma.nucIntegration.findMany({
      where: {
        nucId,
        status: { in: [IntegrationStatus.PENDING, IntegrationStatus.RUNNING] },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, nucId: string, dto: CreateIntegrationDto) {
    await this.assertUserAccessToNuc(userId, nucId);

    // validação mínima por tipo (Wunderground MVP)
    if (dto.kind === 'WUNDERGROUND' as IntegrationKind) {
      const stationId = dto?.config?.stationId;
      const apiKey = dto?.secrets?.apiKey;
      if (!stationId || !apiKey) throw new BadRequestException('stationId e apiKey são obrigatórios');
    }

    return this.prisma.nucIntegration.create({
      data: {
        nucId,
        kind: dto.kind,
        name: dto.name ?? null,
        config: (dto.config as Prisma.InputJsonValue) ?? undefined,
        secrets: (dto.secrets as Prisma.InputJsonValue) ?? undefined,
        status: dto.status ?? IntegrationStatus.DISABLED,
      },
    });
  }

  async update(userId: string, nucId: string, integrationId: string, dto: UpdateIntegrationDto) {
    await this.assertUserAccessToNuc(userId, nucId);
    const exists = await this.prisma.nucIntegration.findFirst({ where: { id: integrationId, nucId } });
    if (!exists) throw new NotFoundException('Integração não encontrada');

    // validação mínima (Wunderground)
    if (dto.kind === 'WUNDERGROUND' as IntegrationKind) {
      const stationId = dto?.config?.stationId ?? (exists.config as any)?.stationId;
      const apiKey = dto?.secrets?.apiKey ?? (exists.secrets as any)?.apiKey;
      if (!stationId || !apiKey) throw new BadRequestException('stationId e apiKey são obrigatórios');
    }

    return this.prisma.nucIntegration.update({
      where: { id: integrationId },
      data: {
        kind: dto.kind ?? undefined,
        name: dto.name ?? undefined,
        config: (dto.config as Prisma.InputJsonValue) ?? undefined,
        secrets: (dto.secrets as Prisma.InputJsonValue) ?? undefined,
        status: dto.status ?? undefined,
      },
    });
  }

  /** update status from AGENT (RUNNING/ERROR) and set lastSync/lastError */
  async agentReportStatus(
    nucId: string,
    integrationId: string,
    status: IntegrationStatus,
    lastError?: string | null,
  ) {
    // aceitar apenas estados que o agente pode reportar
    if (status !== 'RUNNING' && status !== 'ERROR') {
      throw new BadRequestException('Status inválido para agente');
    }
    // garantir que a integração pertence ao NUC
    const exists = await this.prisma.nucIntegration.findFirst({
      where: { id: integrationId, nucId },
    });
    if (!exists) {
      throw new NotFoundException('Integração não encontrada');
    }
    return this.prisma.nucIntegration.update({
      where: { id: integrationId },
      data: {
        status,
        lastSync: new Date(),
        lastError: status === IntegrationStatus.ERROR ? (lastError ?? 'erro desconhecido') : null,
      },
    });
  }

  async remove(userId: string, nucId: string, integrationId: string) {
    await this.assertUserAccessToNuc(userId, nucId);
    const exists = await this.prisma.nucIntegration.findFirst({ where: { id: integrationId, nucId } });
    if (!exists) throw new NotFoundException('Integração não encontrada');
    await this.prisma.nucIntegration.delete({ where: { id: integrationId } });
    return { ok: true };
  }

  /** marcar para aplicar (MVP: apenas muda status para PENDING; push/pull vem a seguir) */
  async apply(userId: string, nucId: string, integrationId: string) {
    await this.assertUserAccessToNuc(userId, nucId);
    const exists = await this.prisma.nucIntegration.findFirst({ where: { id: integrationId, nucId } });
    if (!exists) throw new NotFoundException('Integração não encontrada');
    await this.prisma.nucIntegration.update({
      where: { id: integrationId },
      data: { status: IntegrationStatus.PENDING },
    });
    // TODO: publicar notificação por MQTT ou setar flag para o agente fazer pull imediato
    return { ok: true };
  }
}