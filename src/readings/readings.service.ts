import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MqttService } from '../mqtt/mqtt.service';

@Injectable()
export class ReadingsService {
  constructor(
    private prisma: PrismaService,
    private mqtt: MqttService,
  ) {}

  async create(data: { sensorId: string; value: number }) {
    const reading = await this.prisma.reading.create({
      data: {
        sensorId: data.sensorId,
        value: data.value,
      },
    });

    // Publicar no MQTT
    try {
      const topic = `sfos/sensors/${data.sensorId}`;
      const message = JSON.stringify({
        sensorId: data.sensorId,
        value: data.value,
        ts: reading.ts,
      });
      await this.mqtt.publish(topic, message);
      console.log(`[MQTT] publicado em ${topic}: ${message}`);
    } catch (err) {
      console.error('[MQTT] erro ao publicar:', err.message);
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
