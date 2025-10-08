import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MqttService } from '../mqtt/mqtt.service';

@Injectable()
export class ReadingsService {
  constructor(
    private prisma: PrismaService,
    private mqtt: MqttService,
  ) {}

  // ====== API usada pelo controller, com scoping por farms do utilizador ======

  async createForUser(
    farmIds: string[],
    data: { sensorId: string; value: number },
  ) {
    // garantir que o sensor pertence a uma farm do utilizador
    const sensor = await this.prisma.sensor.findUnique({
      where: { id: data.sensorId },
      select: { id: true, farmId: true },
    });
    if (!sensor || !farmIds.includes(sensor.farmId)) {
      throw new ForbiddenException('Sensor não pertence às suas quintas');
    }
    return this.create(data);
  }

  async listForUser(
    farmIds: string[],
    sensorId?: string,
    limit = 20,
  ) {
    if (sensorId) {
      // validar pertença do sensor
      const sensor = await this.prisma.sensor.findUnique({
        where: { id: sensorId },
        select: { id: true, farmId: true },
      });
      if (!sensor || !farmIds.includes(sensor.farmId)) {
        throw new ForbiddenException('Sensor não pertence às suas quintas');
      }
      return this.findAllBySensor(sensorId, limit);
    }

    // sem sensorId: listar leituras de todos os sensores das farms do utilizador
    const sensors = await this.prisma.sensor.findMany({
      where: { farmId: { in: farmIds } },
      select: { id: true },
    });
    const sensorIds = sensors.map(s => s.id);
    if (sensorIds.length === 0) return [];

    return this.prisma.reading.findMany({
      where: { sensorId: { in: sensorIds } },
      orderBy: { ts: 'desc' },
      take: limit,
    });
  }

  // ====== Métodos internos reutilizáveis ======

  async create(data: { sensorId: string; value: number }) {
    const reading = await this.prisma.reading.create({
      data: {
        sensorId: data.sensorId,
        value: data.value,
      },
    });

    // Publicar no MQTT (best-effort)
    try {
      const topic = `sfos/sensors/${data.sensorId}`;
      const message = JSON.stringify({
        sensorId: data.sensorId,
        value: data.value,
        ts: reading.ts,
      });
      await this.mqtt.publish(topic, message);
      console.log(`[MQTT] publicado em ${topic}: ${message}`);
    } catch (err: any) {
      console.error('[MQTT] erro ao publicar:', err?.message ?? err);
    }

    return reading;
  }

  async findAllBySensor(sensorId: string, limit = 20) {
    return this.prisma.reading.findMany({
      where: { sensorId },
      orderBy: { ts: 'desc' },
      take: limit,
    });
  }
}