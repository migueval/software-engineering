import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { Otp } from './entities/otp.entity';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private notificationService: NotificationService,
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
  ) {}

  async register(name: string, email: string, passwordPlain: string, role: string, lang: 'es' | 'en' = 'es') {
    const user = await this.usersService.create(name, email, passwordPlain, role);
    // Disparar correo de bienvenida de forma asíncrona pasando el idioma
    this.notificationService.sendWelcome(user.email, user.name, lang);
    return {
      status: 'SUCCESS',
      message: lang === 'es' ? 'Usuario registrado exitosamente.' : 'User registered successfully.',
    };
  }

  async login(email: string, passwordPlain: string, lang: 'es' | 'en' = 'es') {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException(
        lang === 'es' 
          ? 'Credenciales incorrectas (Email/Contraseña).' 
          : 'Incorrect credentials (Email/Password).'
      );
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.password);
    if (!isMatch) {
      throw new UnauthorizedException(
        lang === 'es' 
          ? 'Credenciales incorrectas (Email/Contraseña).' 
          : 'Incorrect credentials (Email/Password).'
      );
    }

    // Generar OTP numérico de 6 dígitos
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const stepToken = randomUUID();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // Válido por 3 minutos

    const otpRecord = this.otpRepository.create({
      code: otpCode,
      email: user.email,
      stepToken,
      expiresAt,
      used: false,
    });

    await this.otpRepository.save(otpRecord);

    // Enviar correo de manera asíncrona
    this.notificationService.sendOtp(user.email, otpCode, lang);

    return {
      status: 'OTP_REQUIRED',
      stepToken,
      message: lang === 'es' ? 'Se requiere verificación OTP.' : 'OTP verification required.',
    };
  }

  async verifyOtp(code: string, stepToken: string) {
    const otpRecord = await this.otpRepository.findOne({ where: { stepToken } });
    if (!otpRecord) {
      throw new NotFoundException('Desafío de autenticación inválido.');
    }

    if (otpRecord.used) {
      throw new BadRequestException('Este código OTP ya ha sido utilizado.');
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new BadRequestException('El código OTP ha expirado.');
    }

    if (otpRecord.code !== code) {
      throw new BadRequestException('Código OTP incorrecto.');
    }

    // Marcar el código OTP como utilizado (evita ataques de repetición)
    otpRecord.used = true;
    await this.otpRepository.save(otpRecord);

    const user = await this.usersService.findByEmail(otpRecord.email);
    if (!user) {
      throw new NotFoundException('Usuario asociado al OTP no encontrado.');
    }

    // Generar JWT de sesión
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role, 
      name: user.name 
    };

    const token = this.jwtService.sign(payload);

    return {
      status: 'SUCCESS',
      token,
    };
  }
}
