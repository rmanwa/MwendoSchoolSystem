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
import { School } from '../../database/entities/school.entity';

@Module({
  imports: [
    // 1. Register ALL entities used by AuthService (including School)
    TypeOrmModule.forFeature([User, School, Student, Teacher, Parent, Admin]),
    
    // 2. Configure Passport
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    // 3. Configure JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'default-secret-key',
        signOptions: {
          // 'as any' is required to bypass strict type checking on expiresIn
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