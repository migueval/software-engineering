import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { NotificationService } from '../notification/notification.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Otp } from './entities/otp.entity';
import { Repository } from 'typeorm';
import { UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let notificationService: NotificationService;
  let otpRepository: Repository<Otp>;

  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockNotificationService = {
    sendWelcome: jest.fn(),
    sendOtp: jest.fn(),
  };

  const mockOtpRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: getRepositoryToken(Otp), useValue: mockOtpRepository },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    notificationService = module.get<NotificationService>(NotificationService);
    otpRepository = module.get<Repository<Otp>>(getRepositoryToken(Otp));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a user and send welcome email', async () => {
      const userMock = { id: 1, name: 'Miguel', email: 'migue@example.com', password: 'hashedPassword', role: 'admin' };
      mockUsersService.create.mockResolvedValue(userMock);

      const result = await authService.register('Miguel', 'migue@example.com', 'plainPassword', 'admin', 'es');

      expect(usersService.create).toHaveBeenCalledWith('Miguel', 'migue@example.com', 'plainPassword', 'admin');
      expect(notificationService.sendWelcome).toHaveBeenCalledWith('migue@example.com', 'Miguel', 'es');
      expect(result).toEqual({
        status: 'SUCCESS',
        message: 'Usuario registrado exitosamente.',
      });
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user does not exist', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(authService.login('migue@example.com', 'password', 'es')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const userMock = { id: 1, name: 'Miguel', email: 'migue@example.com', password: 'hashedPassword', role: 'admin' };
      mockUsersService.findByEmail.mockResolvedValue(userMock);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      await expect(authService.login('migue@example.com', 'wrongpassword', 'es')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should generate OTP and save it if password matches', async () => {
      const userMock = { id: 1, name: 'Miguel', email: 'migue@example.com', password: 'hashedPassword', role: 'admin' };
      mockUsersService.findByEmail.mockResolvedValue(userMock);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

      const mockOtpRecord = { id: 1, code: '123456', email: 'migue@example.com', stepToken: 'uuid', expiresAt: new Date(), used: false };
      mockOtpRepository.create.mockReturnValue(mockOtpRecord);
      mockOtpRepository.save.mockResolvedValue(mockOtpRecord);

      const result = await authService.login('migue@example.com', 'correctpassword', 'es');

      expect(otpRepository.create).toHaveBeenCalled();
      expect(otpRepository.save).toHaveBeenCalledWith(mockOtpRecord);
      expect(notificationService.sendOtp).toHaveBeenCalled();
      expect(result.status).toBe('OTP_REQUIRED');
      expect(result.stepToken).toBeDefined();
    });
  });

  describe('verifyOtp', () => {
    it('should throw NotFoundException if stepToken does not exist', async () => {
      mockOtpRepository.findOne.mockResolvedValue(null);

      await expect(authService.verifyOtp('123456', 'invalid-token')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if OTP code is expired', async () => {
      const expiredOtpRecord = { 
        code: '123456', 
        email: 'migue@example.com', 
        stepToken: 'token', 
        expiresAt: new Date(Date.now() - 1000), // Expirado hace 1 segundo
        used: false 
      };
      mockOtpRepository.findOne.mockResolvedValue(expiredOtpRecord);

      await expect(authService.verifyOtp('123456', 'token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if OTP code is incorrect', async () => {
      const validOtpRecord = { 
        code: '123456', 
        email: 'migue@example.com', 
        stepToken: 'token', 
        expiresAt: new Date(Date.now() + 60000), // Válido por 1 minuto
        used: false 
      };
      mockOtpRepository.findOne.mockResolvedValue(validOtpRecord);

      await expect(authService.verifyOtp('654321', 'token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return tokens if OTP is valid and mark it as used', async () => {
      const validOtpRecord = { 
        code: '123456', 
        email: 'migue@example.com', 
        stepToken: 'token', 
        expiresAt: new Date(Date.now() + 60000),
        used: false 
      };
      const userMock = { id: 1, name: 'Miguel', email: 'migue@example.com', role: 'admin' };
      
      mockOtpRepository.findOne.mockResolvedValue(validOtpRecord);
      mockUsersService.findByEmail.mockResolvedValue(userMock);
      mockJwtService.sign.mockReturnValue('signed-jwt-token');

      const result = await authService.verifyOtp('123456', 'token');

      expect(validOtpRecord.used).toBe(true);
      expect(otpRepository.save).toHaveBeenCalledWith(validOtpRecord);
      expect(result.status).toBe('SUCCESS');
      expect(result.token).toBe('signed-jwt-token');
    });
  });
});
