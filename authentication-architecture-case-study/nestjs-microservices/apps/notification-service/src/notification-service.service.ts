import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService implements OnModuleInit {
  private transporter!: nodemailer.Transporter;
  private readonly logger = new Logger(NotificationService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: { user, pass },
      });
      this.logger.log('Nodemailer configurado con SMTP de producción.');
    } else {
      this.logger.warn('SMTP no configurado en .env. Creando cuenta temporal en Ethereal Mail...');
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        this.logger.log(`Nodemailer configurado con Ethereal Mail. Usuario: ${testAccount.user}`);
      } catch (err) {
        this.logger.error('Error creando cuenta en Ethereal Mail, usando transporter mock de consola.', err);
        // Fallback a mock local si falla la red
        this.transporter = {
          sendMail: async (options: nodemailer.SendMailOptions) => {
            this.logger.log(`[MOCK EMAIL] Para: ${options.to} | Asunto: ${options.subject} | Contenido: ${options.html}`);
            return { messageId: 'mock-id-123' };
          }
        } as any;
      }
    }
  }

  async sendOtp(email: string, code: string, lang: string = 'es'): Promise<void> {
    const isEs = lang === 'es';
    
    const subject = isEs 
      ? 'Tu código de verificación OTP' 
      : 'Your OTP Verification Code';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 12px; background-color: #f8fafc;">
        <h2 style="color: #2563eb; text-align: center; margin-bottom: 20px;">
          ${isEs ? 'Código de Seguridad 2FA' : '2FA Security Code'}
        </h2>
        <p style="color: #475569; font-size: 15px;">
          ${isEs ? 'Hola,' : 'Hello,'}
        </p>
        <p style="color: #475569; font-size: 15px;">
          ${isEs 
            ? 'Has solicitado iniciar sesión. Tu código de verificación de un solo uso (OTP) es:' 
            : 'You have requested to sign in. Your one-time verification code (OTP) is:'}
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 36px; font-weight: bold; color: #10b981; letter-spacing: 4px; border: 2px dashed #10b981; padding: 10px 20px; border-radius: 8px; display: inline-block;">
            ${code}
          </span>
        </div>
        <p style="color: #ef4444; font-size: 14px; font-weight: bold; text-align: center; margin-bottom: 15px;">
          ⚠️ ${isEs 
            ? 'Este código expira en 3 minutos (180 segundos).' 
            : 'This code expires in 3 minutes (180 seconds).'}
        </p>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 15px;">
          <p style="color: #64748b; font-size: 13px; text-align: center; line-height: 1.5;">
            ${isEs 
              ? '<strong>Advertencia de seguridad:</strong> Si tú no solicitaste este código, por favor ignora este correo. Tu cuenta sigue estando segura y nadie puede acceder sin este código.'
              : '<strong>Security warning:</strong> If you did not request this code, please ignore this email. Your account remains secure and no one can sign in without this code.'}
          </p>
        </div>
      </div>
    `;

    const fromEmail = this.configService.get<string>('SMTP_USER') || 'security@technicalshowcase.com';
    try {
      const info = await this.transporter.sendMail({
        from: `"Authentication Architecture Case Study" <${fromEmail}>`,
        to: email,
        subject: subject,
        html: htmlContent,
      });

      this.logger.log(`Código OTP enviado a ${email} [Idioma: ${lang.toUpperCase()}]`);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`\n======================================================================\n[EMAIL PREVIEW]: Puedes ver el correo enviado aquí:\n👉 ${previewUrl}\n======================================================================\n`);
      }
    } catch (err) {
      this.logger.error(`Error enviando correo OTP a ${email}:`, err);
    }
  }

  async sendWelcome(email: string, name: string, lang: string = 'es'): Promise<void> {
    const isEs = lang === 'es';
    
    const subject = isEs 
      ? '¡Registro Exitoso! Bienvenido a la plataforma' 
      : 'Registration Successful! Welcome to the platform';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 12px; background-color: #f8fafc;">
        <h2 style="color: #10b981; text-align: center; margin-bottom: 20px;">
          ${isEs ? '¡Bienvenido a la Plataforma!' : 'Welcome to the Platform!'}
        </h2>
        <p style="color: #475569; font-size: 15px;">
          ${isEs ? `Hola <strong>${name}</strong>,` : `Hello <strong>${name}</strong>,`}
        </p>
        <p style="color: #475569; font-size: 15px;">
          ${isEs 
            ? 'Tu cuenta ha sido creada exitosamente. Ahora puedes utilizar tus credenciales para iniciar sesión y completar el doble factor de autenticación (OTP).' 
            : 'Your account has been successfully created. Now you can use your credentials to sign in and complete the two-factor authentication (OTP).'}
        </p>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 25px;">
          <p style="color: #64748b; font-size: 13px; text-align: center;">
            ${isEs 
              ? 'Caso de Estudio: Authentication Architecture Case Study con NestJS y Angular.' 
              : 'Case Study: Authentication Architecture Case Study with NestJS and Angular.'}
          </p>
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 10px;">
            ${isEs 
              ? 'Si tú no realizaste este registro, por favor ponte en contacto con nuestro equipo de soporte.' 
              : 'If you did not sign up for this account, please contact our support team.'}
          </p>
        </div>
      </div>
    `;

    const fromEmail = this.configService.get<string>('SMTP_USER') || 'security@technicalshowcase.com';
    try {
      const info = await this.transporter.sendMail({
        from: `"Authentication Architecture Case Study" <${fromEmail}>`,
        to: email,
        subject: subject,
        html: htmlContent,
      });

      this.logger.log(`Correo de bienvenida enviado a ${email} [Idioma: ${lang.toUpperCase()}]`);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`\n======================================================================\n[EMAIL PREVIEW]: Puedes ver el correo de bienvenida aquí:\n👉 ${previewUrl}\n======================================================================\n`);
      }
    } catch (err) {
      this.logger.error(`Error enviando correo de bienvenida a ${email}:`, err);
    }
  }
}
