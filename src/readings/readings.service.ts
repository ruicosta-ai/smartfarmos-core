import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReadingDto } from './dto/create-reading.dto';
import { MqttService } from '../mqtt/mqtt.service';

@Injectable()
export class ReadingsService {
  constructor(private readonly prisma: PrismaService, private readonly mqtt: MqttService) {}

  async createForUser(userFarmIds: string[], data: CreateReadingDto) {
    const sensor = await this.prisma.sensor.findUnique({ where: { id: data.sensorId } });
    if (!sensor || !userFarmIds.includes(sensor.farmId)) throw new ForbiddenException('No access to sensor');
    const reading = await this.prisma.reading.create({
      data: { sensorId: data.sensorId, value: data.value, ts: data.ts as any },
    });
    try {
      const payload = JSON.stringify({ sensorId: reading.sensorId, value: reading.value, ts: reading.ts });
      this.mqtt.publish(`sfos/sensors/${reading.sensorId}/reading`, payload);
    } catch {}
    return reading;
  }

  async listForUser(userFarmIds: string[], sensorId?: string, limit = 50) {
    if (sensorId) {
      const s = await this.prisma.sensor.findUnique({ where: { id: sensorId }, select: { farmId: true } });
      if (!s || !userFarmIds.includes(s.farmId)) throw new ForbiddenException('No access to sensor');
      return this.prisma.reading.findMany({ where: { sensorId }, orderBy: { ts: 'desc' }, take: limit });
    }
    return this.prisma.reading.findMany({
      where: { sensor: { farmId: { in: userFarmIds.length ? userFarmIds : [''] } } },
      orderBy: { ts: 'desc' },
      take: limit,
    });
  }
}
