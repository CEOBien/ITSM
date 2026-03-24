import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Config
import { appConfig, databaseConfig, jwtConfig, redisConfig, mailConfig } from './config';

// Core
import { GlobalExceptionFilter } from './core/filters';
import { ResponseInterceptor, LoggingInterceptor } from './core/interceptors';
import { AuthModule } from './core/auth/auth.module';

// Business Modules - ITIL v4 Practices
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { RolesModule } from './modules/roles/roles.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { ProblemsModule } from './modules/problems/problems.module';
import { ChangesModule } from './modules/changes/changes.module';
import { ServiceRequestsModule } from './modules/service-requests/service-requests.module';
import { CmdbModule } from './modules/cmdb/cmdb.module';
import { SlaModule } from './modules/sla/sla.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { CatalogModule } from './modules/catalog/catalog.module';

// Shared Services
import { AuditModule } from './shared/audit/audit.module';
import { NotificationModule } from './shared/notification/notification.module';
import { WorkflowModule } from './shared/workflow/workflow.module';

// App
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, mailConfig],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('app.throttle.ttl') * 1000,
          limit: configService.get<number>('app.throttle.limit'),
        },
      ],
      inject: [ConfigService],
    }),

    // Event Emitter (for ITIL event-driven architecture)
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
    }),

    // Cron Jobs (SLA monitoring, escalation)
    ScheduleModule.forRoot(),

    // Core
    AuthModule,

    // Business Modules (ITIL v4 Management Practices)
    UsersModule,
    OrganizationsModule,
    RolesModule,
    IncidentsModule,
    ProblemsModule,
    ChangesModule,
    ServiceRequestsModule,
    CmdbModule,
    SlaModule,
    KnowledgeModule,
    CatalogModule,

    // Shared Infrastructure Services
    AuditModule,
    NotificationModule,
    WorkflowModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Global response interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
