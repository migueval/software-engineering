import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { AuthServiceModule } from './auth-service.module';

async function bootstrap() {
  const logger = new Logger('AuthService-Bootstrap');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AuthServiceModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3003,
    },
  });
  await app.listen();
  logger.log('=======================================================');
  logger.log('🔑 MICROSERVICIO DE AUTENTICACIÓN LISTO EN PUERTO: 3003 (TCP)');
  logger.log('=======================================================');
}
bootstrap();
