import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SentryModule } from '@sentry/nestjs/setup';

// Config
import {
  appConfig,
  authConfig,
  databaseConfig,
  redisConfig,
  mailConfig,
  queueConfig,
  monitoringConfig,
  validate,
} from './config';

// Database
import { DatabaseModule } from './database';

// Common services
import { CommonModule } from './common/services';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { AuditModule } from './modules/audit/audit.module';
import { MailModule } from './modules/mail/mail.module';
import { CacheConfigModule } from './modules/cache/cache.module';
import { AppLoggerModule } from './modules/logger/logger.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { QueueConfigModule } from './modules/queue/queue.module';

// Education modules
import { SubjectsModule } from './modules/subjects/subjects.module';
import { GradesModule } from './modules/grades/grades.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TagsModule } from './modules/tags/tags.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { StudentsModule } from './modules/students/students.module';
import { CommentsModule } from './modules/comments/comments.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ActivityModule } from './modules/activity/activity.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ListenersModule } from './common/events/listeners.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { ReadingProgressModule } from './modules/reading-progress/reading-progress.module';
import { FollowsModule } from './modules/follows/follows.module';
import { SearchModule } from './modules/search/search.module';
import { SettingsModule } from './modules/settings/settings.module';
import { LikesModule } from './modules/likes/likes.module';

// Common
import { JwtAuthGuard } from './modules/auth/guards';
import { RolesGuard, PermissionsGuard } from './common/guards';
import { GlobalExceptionFilter } from './common/filters';
import { ResponseInterceptor, LoggingInterceptor, AuditInterceptor } from './common/interceptors';
import { RequestIdMiddleware } from './common/middleware';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        authConfig,
        databaseConfig,
        redisConfig,
        mailConfig,
        queueConfig,
        monitoringConfig,
      ],
      envFilePath: ['.env.local', '.env'],
      validate,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Event emitter
    EventEmitterModule.forRoot(),

    // Monitoring
    SentryModule.forRoot(),

    // Infrastructure
    DatabaseModule,
    CommonModule,
    CacheConfigModule.register(),
    AppLoggerModule,
    MailModule,

    // Feature modules
    AuthModule,
    UsersModule,
    HealthModule,
    AuditModule,
    FeatureFlagsModule,
    NotificationsModule,
    WebhooksModule,
    FileUploadModule,
    QueueConfigModule.register(),

    // Education modules
    SubjectsModule,
    GradesModule,
    CategoriesModule,
    TagsModule,
    MaterialsModule,
    TeachersModule,
    StudentsModule,
    CommentsModule,
    ReportsModule,
    ActivityModule,
    AnalyticsModule,

    // Event listeners
    ListenersModule,

    // Interactive features
    BookmarksModule,
    ReadingProgressModule,
    FollowsModule,
    LikesModule,
    SearchModule,

    // Admin features
    SettingsModule,
  ],
  providers: [
    // Global JWT auth guard
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Global roles guard
    { provide: APP_GUARD, useClass: RolesGuard },
    // Global permissions guard
    { provide: APP_GUARD, useClass: PermissionsGuard },
    // Global throttler guard
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Global exception filter
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    // Global response interceptor
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    // Global logging interceptor
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    // Global audit interceptor (only fires when @Audit() decorator is present)
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
