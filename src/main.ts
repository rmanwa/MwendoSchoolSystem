import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // ============================================
  // PROXY SUPPORT (for Render, Railway, Heroku, etc.)
  // ============================================
  // Required when behind a reverse proxy (load balancer, nginx, etc.)
  // Ensures req.ip, req.protocol, req.hostname are correct
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // ============================================
  // API PREFIX
  // ============================================
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // ============================================
  // CORS CONFIGURATION (Fixed for Swagger + Production)
  // ============================================
  const frontendUrl = configService.get<string>('app.frontendUrl') || 'http://localhost:3001';
  const apiUrl = configService.get<string>('app.apiUrl') || 'http://localhost:3000';
  
  // Build allowed origins list
  const allowedOrigins = [
    frontendUrl,
    apiUrl,
    'http://localhost:3000',  // Local API/Swagger
    'http://localhost:3001',  // Local Frontend
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ];

  // Add production domains if configured
  const productionDomain = configService.get<string>('app.productionDomain');
  if (productionDomain) {
    allowedOrigins.push(`https://${productionDomain}`);
    allowedOrigins.push(`https://www.${productionDomain}`);
    allowedOrigins.push(`https://api.${productionDomain}`);
  }

  app.enableCors({
    // Allow multiple origins + requests with no origin (curl, Postman, Swagger)
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, mobile apps, Swagger UI)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Allow localhost/127.0.0.1 in development (strict regex - prevents evil-localhost.com attacks)
      const nodeEnv = configService.get<string>('app.nodeEnv') || 'development';
      const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
      if (nodeEnv === 'development' && localhostRegex.test(origin)) {
        return callback(null, true);
      }

      // Reject other origins with explicit error for debugging
      const errorMsg = `CORS blocked origin: ${origin}`;
      console.warn(errorMsg);
      return callback(new Error(errorMsg), false);
    },
    credentials: true,
    // Explicitly allow these headers (Authorization is critical!)
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',  // ← Critical for JWT!
      'Cache-Control',
      'X-Access-Token',
      'X-Refresh-Token',
    ],
    // Explicitly allow these methods
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    // Expose these headers to the client
    exposedHeaders: ['Authorization', 'X-Total-Count', 'X-Page', 'X-Per-Page'],
    // Preflight cache duration (10 minutes)
    maxAge: 600,
  });

  // ============================================
  // VALIDATION PIPES
  // ============================================
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

  // ============================================
  // SWAGGER CONFIGURATION
  // ============================================
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
      'JWT-auth',  // ← This name MUST match @ApiBearerAuth('JWT-auth') in controllers
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Schools', 'School management endpoints')
    .addTag('Students', 'Student management endpoints')
    .addTag('Teachers', 'Teacher management endpoints')
    .addTag('Parents', 'Parent management endpoints')
    .addTag('Classes', 'Class management endpoints')
    .addTag('Subjects', 'Subject management endpoints')
    .addTag('Academic Years', 'Academic year management endpoints')
    .addTag('Terms', 'Term management endpoints')
    .addTag('Fees & Payments', 'Fee structures, invoices, and payments')
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
  
  // Setup Swagger with persistAuthorization enabled
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      // ✅ CRITICAL: Persist authorization between page refreshes
      persistAuthorization: true,
      // Show request duration
      displayRequestDuration: true,
      // Expand operations by default
      docExpansion: 'list',
      // Sort operations alphabetically
      operationsSorter: 'alpha',
      // Sort tags alphabetically
      tagsSorter: 'alpha',
      // Try it out enabled by default
      tryItOutEnabled: true,
      // Filter box for operations
      filter: true,
    },
    // Custom site title
    customSiteTitle: 'School Management API Docs',
  });

  // ============================================
  // START SERVER
  // ============================================
  const port = configService.get<number>('app.port') || 3000;
  await app.listen(port);

  const nodeEnv = configService.get<string>('app.nodeEnv') || 'development';
  
  console.log(`
    🚀 School Management System API is running!
    
    📍 Local:        http://localhost:${port}/${apiPrefix}
    📚 Swagger Docs: http://localhost:${port}/docs
    🌍 Environment:  ${nodeEnv}
    🔒 CORS Origins: ${allowedOrigins.length} configured
    
    ${nodeEnv === 'production' ? '⚠️  Running in PRODUCTION mode' : '🔧 Running in DEVELOPMENT mode'}
  `);
}

bootstrap();