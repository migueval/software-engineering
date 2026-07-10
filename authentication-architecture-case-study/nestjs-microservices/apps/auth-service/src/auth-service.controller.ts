import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth-service.service';

@Controller()
export class AuthServiceController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'generate_otp' })
  async generateOtp(@Payload() data: { email: string; user: any; lang?: string }) {
    return this.authService.generateOtp(data.email, data.user, data.lang || 'es');
  }

  @MessagePattern({ cmd: 'verify_otp' })
  async verifyOtp(@Payload() data: { code: string; stepToken: string }) {
    return this.authService.verifyOtp(data.code, data.stepToken);
  }
}
