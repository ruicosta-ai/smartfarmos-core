import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FarmsModule } from './farms/farms.module';
import { SensorsModule } from './sensors/sensors.module';
import { ReadingsModule } from './readings/readings.module';
import { MqttModule } from './mqtt/mqtt.module';
import { NucsModule } from './nucs/nucs.module';

import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({}), // se já registra noutro módulo, pode remover aqui
    PrismaModule,
    AuthModule,
    UsersModule,
    FarmsModule,
    SensorsModule,
    ReadingsModule,
    MqttModule,
    NucsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}