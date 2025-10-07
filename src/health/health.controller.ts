import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MqttService } from '../mqtt/mqtt.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mqtt: MqttService,
  ) {}

  @Get()
  async getHealth() {
    const dbUp = await this.prisma.ping();
    const mqttUp = this.mqtt.isConnected();

    return {
      service: 'SmartFarm OS Core',
      db: dbUp ? 'up' : 'down',
      mqtt: mqttUp ? 'up' : 'down',
      timestamp: new Date().toISOString(),
    };
  }
}
