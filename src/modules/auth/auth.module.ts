import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../../database/entities/user.entity';
import { Student } from '../../database/entities/student.entity';
import { Teacher } from '../../database/entities/teacher.entity';
import { Parent } from '../../database/entities/parent.entity';
import { Admin } from '../../database/entities/admin.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Student, Teacher, Parent, Admin]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'default-secret-key',
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') as any || '1d',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}