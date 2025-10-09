// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

function getCorsOrigins() {
  // 1) Se definires CORS_ORIGINS no ambiente (lista por vírgulas), usa isso.
  // 2) Caso contrário, usa uma whitelist “sensata” para dev + ferramentas.
  const env = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (env.length) return env;

  return [
    'http://localhost:3000',  // Next/Vite default
    'http://localhost:4000',  // teu Next em dev
    'http://localhost:8081',  // ToolJet
    'http://localhost:5173',  // Vite
    'http://192.168.1.234:4000', // teu IP LAN visto no terminal
    'http://192.168.10.169:4000',
    'https://smartfarmos.pt',
  ];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prisma: shutdown limpo
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // src/main.ts
app.enableCors({
  origin: [
    'http://localhost:4000',
    'https://app.smartfarmos.pt',
  ],
  credentials: true,
});

  // Validação global
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('SmartFarm OS Core API')
    .setDescription('Endpoints do Core (auth, farms, sensors, readings, health)')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Porta configurável
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}
bootstrap();