import './instrument';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api';
  const corsOrigins = configService.get<string[]>('app.corsOrigins') || [
    'http://localhost:3001',
  ];

  // Security
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-Correlation-ID',
    ],
  });

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger
  if (configService.get<string>('app.env') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Education Content Platform API')
      .setDescription('LMS backend API for teachers and students — materials, discussions, analytics')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentication & Authorization')
      .addTag('Users', 'User Management')
      .addTag('Health', 'Health Checks')
      .addTag('Audit', 'Audit Logs')
      .addTag('Feature Flags', 'Feature Flag Management')
      .addTag('Notifications', 'User Notifications')
      .addTag('Webhooks', 'Webhook Management')
      .addTag('File Upload', 'File Upload & Storage')
      .addTag('Subjects', 'Subject Management')
      .addTag('Grades', 'Grade Level Management')
      .addTag('Categories', 'Category Hierarchy')
      .addTag('Tags', 'Tag Management')
      .addTag('Materials', 'Educational Materials')
      .addTag('Teachers', 'Teacher Profiles')
      .addTag('Students', 'Student Profiles')
      .addTag('Comments', 'Material Comments & Replies')
      .addTag('Reports', 'Content Reports & Moderation')
      .addTag('Activity', 'User Activity Tracking')
      .addTag('Analytics', 'Dashboard Analytics')
      .addTag('Bookmarks', 'Material Bookmarks')
      .addTag('Likes', 'Material Likes')
      .addTag('Follows', 'User Follow System')
      .addTag('Reading Progress', 'Reading Progress Tracking')
      .addTag('Search', 'Full-Text Search')
      .addTag('Settings', 'Platform Settings Management')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(`Swagger docs available at http://localhost:${port}/docs`);
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`Application running on http://localhost:${port}`);
  logger.log(`API available at http://localhost:${port}/${apiPrefix}`);
}

void bootstrap();
