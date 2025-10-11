import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FarmsService {
  constructor(private readonly prisma: PrismaService) {}

  /* =========================
     Listagens
  ========================= */

  listForUser(farmIds: string[]) {
    return this.prisma.farm.findMany({
      where: { id: { in: farmIds.length ? farmIds : [''] } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listForUserPaged(farmIds: string[], skip: number, take: number) {
    return this.prisma.farm.findMany({
      where: { id: { in: farmIds.length ? farmIds : [''] } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  countForUser(farmIds: string[]) {
    return this.prisma.farm.count({
      where: { id: { in: farmIds.length ? farmIds : [''] } },
    });
  }

  /* =========================
     Criação & Membros
  ========================= */

  async createWithOwner(
    userId: string,
    data: { name: string; location?: string | null },
  ) {
    const farm = await this.prisma.farm.create({
      data: {
        name: data.name,
        location: data.location ?? null,
      },
    });

    await this.prisma.userFarm.create({
      data: { userId, farmId: farm.id, role: 'OWNER' },
    });

    return farm;
  }

  async addMember(
    farmId: string,
    userId: string,
    role: 'OWNER' | 'MANAGER' | 'WORKER' | 'VIEWER' = 'OWNER',
  ) {
    const exists = await this.prisma.farm.findUnique({ where: { id: farmId } });
    if (!exists) throw new NotFoundException('Farm not found');

    await this.prisma.userFarm.upsert({
      where: { userId_farmId: { userId, farmId } },
      update: { role },
      create: { userId, farmId, role },
    });

    return { farmId, userId, role };
  }

  /* =========================
     Remoção (com validação de dono)
  ========================= */

  private async assertOwner(userId: string | undefined, farmId: string) {
    if (!userId) throw new ForbiddenException('Missing user');

    const membership = await this.prisma.userFarm.findUnique({
      where: { userId_farmId: { userId, farmId } },
      select: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this farm');
    }
    if (membership.role !== 'OWNER') {
      throw new ForbiddenException('Only OWNER can delete the farm');
    }
  }

  /**
   * Apaga a quinta e entidades associadas.
   * A ordem segue o sentido “folhas → raiz” para cumprir FKs:
   * 1) readings (via sensor)
   * 2) sensors
   * 3) nucs
   * 4) userFarm (membros)
   * 5) farm
   */
  async deleteFarm(farmId: string, userId?: string) {
    const farm = await this.prisma.farm.findUnique({
      where: { id: farmId },
      select: { id: true },
    });
    if (!farm) throw new NotFoundException('Farm not found');

    await this.assertOwner(userId, farmId);

    await this.prisma.$transaction(async (tx) => {
      // 1) readings -> dependem de sensors
      await tx.reading.deleteMany({
        where: { sensor: { farmId } },
      });

      // 2) sensors
      await tx.sensor.deleteMany({
        where: { farmId },
      });

      // 3) nucs (caso tenhas o modelo Nuc com farmId)
      await tx.nuc?.deleteMany?.({
        where: { farmId },
      } as any); // o "as any" evita erro se o client ainda não tiver Nuc em alguns ambientes

      // 4) membros (userFarm)
      await tx.userFarm.deleteMany({
        where: { farmId },
      });

      // 5) a própria farm
      await tx.farm.delete({
        where: { id: farmId },
      });
    });

    return { success: true };
  }
}