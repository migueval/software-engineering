import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  const logger = new Logger('ApiGateway-Bootstrap');
  const app = await NestFactory.create(ApiGatewayModule);

  // Prefijo global de rutas para Angular (/api/...)
  app.setGlobalPrefix('api');

  // CORS habilitado para el puerto de Angular
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Tubería de validación global de esquemas DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3001;

  await app.listen(port);
  logger.log('=======================================================');
  logger.log(`🚀 API GATEWAY PÚBLICO LISTO EN: http://localhost:${port}/api`);
  logger.log('=======================================================');
}
bootstrap();
