import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../database/entities/user.entity';
import { Student } from '../../database/entities/student.entity';
import { Teacher } from '../../database/entities/teacher.entity';
import { Parent } from '../../database/entities/parent.entity';
import { Admin } from '../../database/entities/admin.entity';
import { Role } from '../../common/constants/roles.constant';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Parent)
    private parentRepository: Repository<Parent>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string; user: Partial<User> }> {
    const { email, phone, password, firstName, lastName, middleName, role } = registerDto;

    const existingEmail = await this.userRepository.findOne({ where: { email } });
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    if (phone) {
      const existingPhone = await this.userRepository.findOne({ where: { phone } });
      if (existingPhone) {
        throw new ConflictException('Phone number already registered');
      }
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = this.userRepository.create({
      email,
      phone,
      password: hashedPassword,
      firstName,
      lastName,
      middleName,
      role: role || Role.STUDENT,
      isActive: true,
      isEmailVerified: false,
      emailVerificationToken: uuidv4(),
    });

    await this.userRepository.save(user);
    await this.createRoleProfile(user, registerDto);

    const { password: _, refreshToken, emailVerificationToken, ...userResponse } = user;

    return {
      message: 'Registration successful. Please verify your email.',
      user: userResponse,
    };
  }

  private async createRoleProfile(user: User, registerDto: RegisterDto): Promise<void> {
    switch (user.role) {
      case Role.STUDENT:
        const student = this.studentRepository.create({
          userId: user.id,
          admissionNumber: registerDto.admissionNumber || `ADM${Date.now()}`,
          dateOfBirth: registerDto.dateOfBirth || new Date('2010-01-01'),
          gender: registerDto.gender || 'other',
          admissionDate: new Date(),
          status: 'active',
        });
        await this.studentRepository.save(student);
        break;

      case Role.TEACHER:
        const teacher = this.teacherRepository.create({
          userId: user.id,
          employeeId: registerDto.employeeId || `EMP${Date.now()}`,
          joinDate: new Date(),
          status: 'active',
        });
        await this.teacherRepository.save(teacher);
        break;

      case Role.PARENT:
        const parent = this.parentRepository.create({
          userId: user.id,
          relationship: registerDto.relationship || 'guardian',
        });
        await this.parentRepository.save(parent);
        break;

      case Role.ADMIN:
      case Role.SUPER_ADMIN:
        const admin = this.adminRepository.create({
          userId: user.id,
          adminLevel: user.role === Role.SUPER_ADMIN ? 'super' : 'junior',
          canManageUsers: true,
          canManageClasses: true,
          canViewReports: true,
        });
        await this.adminRepository.save(admin);
        break;
    }
  }

  async login(loginDto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Partial<User>;
  }> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: [{ email }, { phone: email }],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated. Please contact administrator.');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        `Account is locked. Try again after ${user.lockedUntil.toLocaleTimeString()}`,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.failedLoginAttempts = 0;
      }

      await this.userRepository.save(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    user.lastLogin = new Date();

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret') || 'default-refresh-secret';
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
    
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.save(user);

    const { password: _, refreshToken: __, ...userResponse } = user;

    return {
      accessToken,
      refreshToken,
      user: userResponse,
    };
  }

  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const refreshSecret = this.configService.get<string>('jwt.refreshSecret') || 'default-refresh-secret';
      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });

      const user = await this.userRepository.findOne({ where: { id: payload.sub } });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = { sub: user.id, email: user.email, role: user.role };
      const newAccessToken = this.jwtService.sign(newPayload);
      const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
      
      const newRefreshToken = this.jwtService.sign(newPayload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      });

      user.refreshToken = await bcrypt.hash(newRefreshToken, 10);
      await this.userRepository.save(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (user) {
      user.refreshToken = undefined;
      await this.userRepository.save(user);
    }

    return { message: 'Logged out successfully' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return { message: 'If the email exists, a password reset link has been sent.' };
    }

    const resetToken = uuidv4();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await this.userRepository.save(user);

    console.log(`Password reset token for ${email}: ${resetToken}`);

    return { message: 'If the email exists, a password reset link has been sent.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, password } = resetPasswordDto;

    const user = await this.userRepository.findOne({
      where: { passwordResetToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = undefined;

    await this.userRepository.save(user);

    return { message: 'Password reset successful. Please login with your new password.' };
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.refreshToken = undefined;

    await this.userRepository.save(user);

    return { message: 'Password changed successfully. Please login again.' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;

    await this.userRepository.save(user);

    return { message: 'Email verified successfully' };
  }

  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, refreshToken, emailVerificationToken, passwordResetToken, ...userResponse } =
      user;

    return userResponse;
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is deactivated');
    }

    return user;
  }
}