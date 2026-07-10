import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Configurar prefijo de ruta global para la API (/api/...)
  app.setGlobalPrefix('api');

  // Habilitar CORS para permitir peticiones desde el cliente Angular (http://localhost:4200)
  app.enableCors({
    origin: '*', // En desarrollo permitimos cualquier origen; ajustar en producción
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Habilitar tuberías de validación global de esquemas DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades sobrantes no declaradas en el DTO
      transform: true, // Convierte tipos automáticamente si es posible
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);
  logger.log(`=======================================================`);
  logger.log(`🚀 MONOLITO BACKEND LISTO EN: http://localhost:${port}/api`);
  logger.log(`=======================================================`);
}
bootstrap();
