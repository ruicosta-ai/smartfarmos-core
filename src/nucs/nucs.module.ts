import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NucsService } from './nucs.service';
import { NucsController } from './nucs.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('AGENT_JWT_SECRET'),
        signOptions: { expiresIn: cfg.get<string>('AGENT_JWT_EXPIRES') || '7d' },
      }),
    }),
  ],
  controllers: [NucsController],
  providers: [NucsService, PrismaService],
  exports: [NucsService],
})
export class NucsModule {}