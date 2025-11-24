import { StudentsModule } from './modules/students/students.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configs from './config';
import { AuthModule } from './modules/auth/auth.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { School } from './database/entities/school.entity';
import { ClassesModule } from './modules/classes/classes.module';

@Module({
  imports: [
    ClassesModule,
    // 1. Load Environment Variables
    ConfigModule.forRoot({
      isGlobal: true,
      load: configs,
      envFilePath: '.env',
    }),

    // 2. Global Database Connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<string>('app.nodeEnv') === 'development',
        logging: configService.get<string>('app.nodeEnv') === 'development',
      }),
      inject: [ConfigService],
    }),

    // 3. Register School Entity for Middleware Usage (Critical!)
    // This MUST be in imports, NOT inside forRootAsync
    TypeOrmModule.forFeature([School]),

    // 4. Import Feature Modules
    AuthModule,
    StudentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  // 5. Configure Multi-Tenant Middleware
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        'auth/(.*)', // Exclude login/register
        'health', // Exclude health checks
        '/', // Exclude root
      )
      .forRoutes('*'); // Apply to all other routes
  }
}
