import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { NucsService } from './nucs.service';
import { NucsController } from './nucs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}), // para injetar JwtService
    ConfigModule,           // para ConfigService
  ],
  controllers: [NucsController],
  providers: [NucsService],
  exports: [NucsService],
})
export class NucsModule {}