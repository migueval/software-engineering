import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user-service.service';

@Controller()
export class UserServiceController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern({ cmd: 'find_user_by_email' })
  async findByEmail(@Payload() data: { email: string }) {
    return this.userService.findByEmail(data.email);
  }

  @MessagePattern({ cmd: 'create_user' })
  async createUser(@Payload() data: { name: string; email: string; passwordPlain: string; role: string; lang?: string }) {
    return this.userService.create(data.name, data.email, data.passwordPlain, data.role, data.lang || 'es');
  }
}
