import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Ativar CORS
  app.enableCors({
    origin: [
      'http://localhost:5173',  // para o frontend local (Vite, React, etc.)
      'http://localhost:8081',  // para ToolJet local
      'http://localhost:3000',  // se usares front integrado
      'https://smartfarmos.pt'  // domínio real
    ],
    credentials: true,
  });

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const config = new DocumentBuilder()
  .setTitle('SmartFarm OS Core API')
  .setDescription('Endpoints do Core (auth, farms, sensors, readings, health)')
  .setVersion('1.0.0')
  .addBearerAuth() // botão "Authorize" para tokens JWT
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('docs', app, document, {
  swaggerOptions: { persistAuthorization: true },
});

  await app.listen(3000);
}
bootstrap();