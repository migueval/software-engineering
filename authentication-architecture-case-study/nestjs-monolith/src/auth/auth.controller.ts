import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsIn, IsOptional, Matches } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

// DTOs para validación de entrada
export class RegisterDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @IsString({ message: 'El nombre debe ser una cadena.' })
  name!: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  email!: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
    message: 'La contraseña debe contener al menos una letra mayúscula, una letra minúscula, un número y un carácter especial.',
  })
  password!: string;

  @IsNotEmpty({ message: 'El rol es obligatorio.' })
  @IsIn(['user', 'admin'], { message: 'El rol debe ser user o admin.' })
  role!: string;

  @IsOptional()
  @IsIn(['es', 'en'], { message: 'El idioma debe ser es o en.' })
  lang?: 'es' | 'en';
}

export class LoginDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  email!: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  password!: string;

  @IsOptional()
  @IsIn(['es', 'en'], { message: 'El idioma debe ser es o en.' })
  lang?: 'es' | 'en';
}

export class VerifyOtpDto {
  @IsNotEmpty({ message: 'El token de paso es obligatorio.' })
  @IsString()
  stepToken!: string;

  @IsNotEmpty({ message: 'El código OTP es obligatorio.' })
  @IsString()
  @MinLength(6, { message: 'El código OTP debe tener 6 dígitos.' })
  code!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.name,
      registerDto.email,
      registerDto.password,
      registerDto.role,
      registerDto.lang || 'es',
    );
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Máximo 5 intentos por minuto
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password, loginDto.lang || 'es');
  }

  @Post('verify-otp')
  @Throttle({ default: { limit: 3, ttl: 180000 } }) // Máximo 3 intentos de verificación OTP por cada 3 minutos (180s)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.code, verifyOtpDto.stepToken);
  }

  // Endpoint protegido para pruebas de JWT y Roles (RBAC)
  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user') // Admite ambos roles
  getProfile(@Request() req: any) {
    return {
      message: 'Acceso concedido a recurso protegido.',
      user: req.user,
    };
  }

  // Endpoint protegido exclusivo para administradores
  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin') // Solo administradores
  getAdminData(@Request() req: any) {
    return {
      message: 'Acceso exclusivo de administrador concedido.',
      adminUser: req.user,
    };
  }
}
