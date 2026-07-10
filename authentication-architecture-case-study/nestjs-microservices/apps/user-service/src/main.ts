import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { UserServiceModule } from './user-service.module';

async function bootstrap() {
  const logger = new Logger('UserService-Bootstrap');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(UserServiceModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3002,
    },
  });
  await app.listen();
  logger.log('=======================================================');
  logger.log('👥 MICROSERVICIO DE USUARIOS LISTO EN PUERTO: 3002 (TCP)');
  logger.log('=======================================================');
}
bootstrap();
