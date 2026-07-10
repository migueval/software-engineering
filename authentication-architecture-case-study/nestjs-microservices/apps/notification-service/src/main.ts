import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { NotificationServiceModule } from './notification-service.module';

async function bootstrap() {
  const logger = new Logger('NotificationService-Bootstrap');
  const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(NotificationServiceModule, {
    transport: Transport.RMQ,
    options: {
      urls: [rabbitUrl],
      queue: 'notification_queue',
      queueOptions: {
        durable: true,
      },
    },
  });
  await app.listen();
  logger.log('=======================================================');
  logger.log('✉️ MICROSERVICIO DE NOTIFICACIONES ESCUCHANDO EN RABBITMQ');
  logger.log('=======================================================');
}
bootstrap();
