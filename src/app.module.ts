import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FarmsModule } from './farms/farms.module';
import { SensorsModule } from './sensors/sensors.module';
import { ReadingsModule } from './readings/readings.module';
import { MqttModule } from './mqtt/mqtt.module';
import { NucsModule } from './nucs/nucs.module';
import { WeatherModule } from './weather/weather.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    FarmsModule,
    SensorsModule,
    ReadingsModule,
    MqttModule,
    NucsModule,
    WeatherModule, // ensure weather routes are registered
  ],
  controllers: [HealthController],
})
export class AppModule {}