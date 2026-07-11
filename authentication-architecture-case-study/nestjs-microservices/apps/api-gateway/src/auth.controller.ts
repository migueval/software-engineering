import { Controller, Post, Body, Get, UseGuards, Request, Inject, ConflictException, UnauthorizedException, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsIn, IsOptional } from 'class-validator';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import * as bcrypt from 'bcrypt';
import { Throttle } from '@nestjs/throttler';
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
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
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

// Convertidor de errores RPC internos a excepciones HTTP estándar
function handleRpcError(err: any) {
  const message = err.message || err;
  if (typeof message === 'string') {
    if (message.startsWith('CONFLICT:')) {
      throw new ConflictException(message.replace('CONFLICT:', ''));
    }
    if (message.startsWith('UNAUTHORIZED:')) {
      throw new UnauthorizedException(message.replace('UNAUTHORIZED:', ''));
    }
    if (message.startsWith('BAD_REQUEST:')) {
      throw new BadRequestException(message.replace('BAD_REQUEST:', ''));
    }
    if (message.startsWith('NOT_FOUND:')) {
      throw new NotFoundException(message.replace('NOT_FOUND:', ''));
    }
  }
  throw new InternalServerErrorException(message);
}

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      return await firstValueFrom(
        this.userClient.send(
          { cmd: 'create_user' },
          {
            name: registerDto.name,
            email: registerDto.email,
            passwordPlain: registerDto.password,
            role: registerDto.role,
            lang: registerDto.lang || 'es',
          },
        ),
      );
    } catch (err) {
      handleRpcError(err);
    }
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Máximo 5 intentos por minuto
  async login(@Body() loginDto: LoginDto) {
    try {
      // 1. Validar el usuario y obtener sus credenciales del microservicio User
      const user = await firstValueFrom(
        this.userClient.send({ cmd: 'find_user_by_email' }, { email: loginDto.email }),
      );

      const isEs = (loginDto.lang || 'es') === 'es';

      if (!user) {
        throw new UnauthorizedException(
          isEs 
            ? 'Credenciales incorrectas (Email/Contraseña).' 
            : 'Incorrect credentials (Email/Password).'
        );
      }

      // 2. Comparar contraseñas de forma asíncrona en el Gateway
      const isMatch = await bcrypt.compare(loginDto.password, user.password);
      if (!isMatch) {
        throw new UnauthorizedException(
          isEs 
            ? 'Credenciales incorrectas (Email/Contraseña).' 
            : 'Incorrect credentials (Email/Password).'
        );
      }

      // 3. Generar perfil para persistir temporalmente en Redis
      const userProfile = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      // 4. Solicitar al microservicio Auth la generación del código OTP
      return await firstValueFrom(
        this.authClient.send(
          { cmd: 'generate_otp' },
          { 
            email: user.email, 
            user: userProfile, 
            lang: loginDto.lang || 'es' 
          },
        ),
      );
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      handleRpcError(err);
    }
  }

  @Post('verify-otp')
  @Throttle({ default: { limit: 3, ttl: 180000 } }) // Máximo 3 intentos por cada 3 minutos (180s)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    try {
      return await firstValueFrom(
        this.authClient.send(
          { cmd: 'verify_otp' },
          { code: verifyOtpDto.code, stepToken: verifyOtpDto.stepToken },
        ),
      );
    } catch (err) {
      handleRpcError(err);
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  getProfile(@Request() req: any) {
    return {
      message: 'Acceso concedido a recurso protegido en Microservicios.',
      user: req.user,
    };
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAdminData(@Request() req: any) {
    return {
      message: 'Acceso exclusivo de administrador concedido en Microservicios.',
      adminUser: req.user,
    };
  }
}
