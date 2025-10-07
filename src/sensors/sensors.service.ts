import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSensorDto } from './dto/create-sensor.dto';

@Injectable()
export class SensorsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userFarmIds: string[], farmId?: string) {
    const where: any = {};
    if (farmId) {
      if (!userFarmIds.includes(farmId)) throw new ForbiddenException('No access to farm');
      where.farmId = farmId;
    } else {
      where.farmId = { in: userFarmIds.length ? userFarmIds : [''] };
    }
    return this.prisma.sensor.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async createForUser(userFarmIds: string[], data: CreateSensorDto) {
    if (!userFarmIds.includes(data.farmId)) throw new ForbiddenException('No access to farm');
    return this.prisma.sensor.create({ data });
  }
}
