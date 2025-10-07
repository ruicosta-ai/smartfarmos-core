import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FarmsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async createWithOwner(userId: string, data: { name: string; location?: string }) {
    const farm = await this.prisma.farm.create({ data });
    await this.prisma.userFarm.create({ data: { userId, farmId: farm.id, role: 'OWNER' } });
    return farm;
  }

  async addMember(farmId: string, userId: string, role: 'OWNER'|'MANAGER'|'WORKER'|'VIEWER' = 'OWNER') {
    const exists = await this.prisma.farm.findUnique({ where: { id: farmId } });
    if (!exists) throw new NotFoundException('Farm not found');
    await this.prisma.userFarm.upsert({
      where: { userId_farmId: { userId, farmId } },
      update: { role },
      create: { userId, farmId, role },
    });
    return { farmId, userId, role };
  }
}
