import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  app.enableCors({
    origin: configService.get<string>('app.frontendUrl') || 'http://localhost:3001',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('School Management System API')
    .setDescription('Complete API documentation for the School Management System')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Students', 'Student management endpoints')
    .addTag('Teachers', 'Teacher management endpoints')
    .addTag('Parents', 'Parent management endpoints')
    .addTag('Classes', 'Class management endpoints')
    .addTag('Subjects', 'Subject management endpoints')
    .addTag('Timetable', 'Timetable management endpoints')
    .addTag('Assignments', 'Assignment management endpoints')
    .addTag('Attendance', 'Attendance management endpoints')
    .addTag('Grades', 'Grade management endpoints')
    .addTag('Report Cards', 'Report card endpoints')
    .addTag('Discipline', 'Discipline tracking endpoints')
    .addTag('E-Learning', 'E-Learning module endpoints')
    .addTag('Events', 'Event management endpoints')
    .addTag('Calendar', 'Calendar endpoints')
    .addTag('Notifications', 'Notification endpoints')
    .addTag('Messages', 'Messaging endpoints')
    .addTag('Analytics', 'Analytics endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get<number>('app.port') || 3000;
  await app.listen(port);

  console.log(`
    🚀 School Management System API is running!
    📍 Local: http://localhost:${port}/${apiPrefix}
    📚 Swagger Docs: http://localhost:${port}/docs
    🌍 Environment: ${configService.get<string>('app.nodeEnv') || 'development'}
  `);
}

bootstrap();