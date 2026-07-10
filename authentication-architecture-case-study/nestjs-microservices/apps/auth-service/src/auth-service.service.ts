import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { randomUUID } from 'crypto';
import { RedisService } from './redis.service';

interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    @Inject('RABBITMQ_CLIENT')
    private readonly rabbitClient: ClientProxy,
  ) {}

  async generateOtp(email: string, user: UserPayload, lang: string = 'es') {
    // Generar OTP numérico de 6 dígitos
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const stepToken = randomUUID();

    const challenge = {
      email,
      code: otpCode,
      user,
    };

    // Almacenar en Redis con TTL de 3 minutos (180 segundos)
    await this.redisService.set(`challenge:${stepToken}`, JSON.stringify(challenge), 180);

    // Emitir evento asíncrono a RabbitMQ
    this.rabbitClient.emit('otp_generated', {
      email,
      code: otpCode,
      lang,
    });

    return {
      status: 'OTP_REQUIRED',
      stepToken,
      message: lang === 'es' ? 'Se requiere verificación OTP.' : 'OTP verification required.',
    };
  }

  async verifyOtp(code: string, stepToken: string) {
    const key = `challenge:${stepToken}`;
    const rawChallenge = await this.redisService.get(key);

    if (!rawChallenge) {
      throw new RpcException('NOT_FOUND:Desafío de autenticación inválido o expirado.');
    }

    const challenge = JSON.parse(rawChallenge);

    if (challenge.code !== code) {
      throw new RpcException('BAD_REQUEST:Código OTP incorrecto.');
    }

    // El código es correcto, invalidarlo (borrar de Redis) para prevenir repetición
    await this.redisService.del(key);

    const user: UserPayload = challenge.user;

    // Generar token JWT final
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = this.jwtService.sign(payload);

    return {
      status: 'SUCCESS',
      token,
    };
  }
}
