import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationServiceController } from './notification-service.controller';
import { NotificationService } from './notification-service.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [NotificationServiceController],
  providers: [NotificationService],
})
export class NotificationServiceModule {}
