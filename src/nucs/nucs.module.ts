import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { NucsService } from './nucs.service';
import { NucsController } from './nucs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { IntegrationsController, IntegrationsAgentController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}), // para injetar JwtService
    ConfigModule,           // para ConfigService
  ],
  controllers: [NucsController, IntegrationsController, IntegrationsAgentController],
  providers: [NucsService, IntegrationsService],
  exports: [NucsService],
})
export class NucsModule {}