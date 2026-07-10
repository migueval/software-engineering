import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject('RABBITMQ_CLIENT')
    private readonly rabbitClient: ClientProxy,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(name: string, email: string, passwordPlain: string, role: string, lang: string = 'es') {
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new RpcException('CONFLICT:El correo electrónico ya está registrado.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordPlain, salt);

    const user = this.usersRepository.create({
      name,
      email,
      password: passwordHash,
      role,
    });

    const savedUser = await this.usersRepository.save(user);

    // Emitir evento asíncrono a RabbitMQ
    this.rabbitClient.emit('user_registered', {
      email: savedUser.email,
      name: savedUser.name,
      lang,
    });

    return {
      id: savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
    };
  }
}
