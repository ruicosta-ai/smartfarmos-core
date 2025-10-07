import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { MqttModule } from './mqtt/mqtt.module';
import { HealthController } from './health/health.controller';
import { FarmsModule } from './farms/farms.module';
import { SensorsModule } from './sensors/sensors.module';
import { ReadingsModule } from './readings/readings.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ConfigModule, PrismaModule, MqttModule, FarmsModule, SensorsModule, ReadingsModule, UsersModule, AuthModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
