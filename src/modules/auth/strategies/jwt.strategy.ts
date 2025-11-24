import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'default-secret-key',
    });
  }

  async validate(payload: any) {
    console.log('JWT Strategy - Validating payload:', payload);
    
    const user = await this.authService.validateUser(payload.sub);
    
    if (!user) {
      console.error('JWT Strategy - User not found');
      throw new UnauthorizedException('User not found');
    }

    console.log('JWT Strategy - User validated successfully');

    // ✅ CRITICAL: Return schoolId so it's available in req.user
    return { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      schoolId: payload.schoolId || user.schoolId,  // ← This is the fix!
      sub: payload.sub
    };
  }
}
