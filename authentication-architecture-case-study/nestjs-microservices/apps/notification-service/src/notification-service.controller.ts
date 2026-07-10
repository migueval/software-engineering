import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification-service.service';

@Controller()
export class NotificationServiceController {
  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern('user_registered')
  async handleUserRegistered(@Payload() data: { email: string; name: string; lang?: string }) {
    await this.notificationService.sendWelcome(data.email, data.name, data.lang || 'es');
  }

  @EventPattern('otp_generated')
  async handleOtpGenerated(@Payload() data: { email: string; code: string; lang?: string }) {
    await this.notificationService.sendOtp(data.email, data.code, data.lang || 'es');
  }
}
