import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as compression from 'compression';
import * as helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
    cors: false,
  });

  const configService = app.get(ConfigService);
  const appName = configService.get<string>('app.name');
  const env = configService.get<string>('app.env');
  const apiPrefix = configService.get<string>('app.apiPrefix');
  const port = configService.get<number>('app.port');
  const corsOrigins = configService.get<string[]>('app.corsOrigins');

  // Security — CORP cross-origin để SPA (port khác, ví dụ Next :3001) gọi API được
  app.use(
    helmet.default({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(compression());

  // CORS
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
  });

  // API versioning
  app.enableVersioning({ type: VersioningType.URI });
  app.setGlobalPrefix(apiPrefix);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      disableErrorMessages: env === 'production',
    }),
  );

  // Swagger Documentation
  if (env !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('ITSM API - ITIL v4')
      .setDescription(
        `
## IT Service Management Platform

Hệ thống quản lý dịch vụ CNTT theo chuẩn **ITIL v4** - Triển khai đầy đủ các ITIL Practice:

### Core Management Practices:
- 🚨 **Incident Management** - Quản lý sự cố, khôi phục dịch vụ nhanh nhất
- 🔍 **Problem Management** - Phân tích nguyên nhân gốc rễ, Known Error Database
- 🔄 **Change Enablement** - Kiểm soát thay đổi, CAB approval, Risk assessment
- 📋 **Service Request Management** - Xử lý yêu cầu dịch vụ thường nhật
- 🗄️ **Service Configuration Management** - CMDB, quản lý CI và quan hệ
- 📊 **Service Level Management** - SLA/OLA/UC, monitoring, escalation
- 📚 **Knowledge Management** - Knowledge Base, KEDB, workarounds
- 🛒 **Service Catalogue Management** - Danh mục dịch vụ IT

### Architecture:
- Business Architecture với Domain-Driven Design
- Event-driven với NestJS EventEmitter
- Role-based Access Control (RBAC)
- Full Audit Trail
- SLA automation & escalation
      `,
      )
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('Authentication', 'Đăng nhập, phân quyền')
      .addTag('Users - Quản lý người dùng', 'Quản lý tài khoản và vai trò')
      .addTag('Incidents - Quản lý sự cố (ITIL)', 'ITIL Incident Management')
      .addTag('Problems - Quản lý vấn đề (ITIL)', 'ITIL Problem Management')
      .addTag('Changes - Quản lý thay đổi (ITIL Change Enablement)', 'ITIL Change Management')
      .addTag(
        'Service Requests - Quản lý yêu cầu dịch vụ (ITIL)',
        'ITIL Service Request Management',
      )
      .addTag('CMDB - Configuration Management Database (ITIL)', 'Quản lý CI và quan hệ')
      .addTag('SLA - Service Level Management (ITIL)', 'Quản lý SLA/OLA')
      .addTag('Knowledge - Quản lý tri thức (ITIL Knowledge Management)', 'Knowledge Base')
      .addTag('Catalog - Service Catalogue (ITIL)', 'Danh mục dịch vụ')
      .addTag('System', 'System information & health check')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        tagsSorter: 'alpha',
      },
      customSiteTitle: 'ITSM API Documentation',
    });

    logger.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);

  logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  logger.log(`🚀 ${appName} started in [${env}] mode`);
  logger.log(`🌐 API:    http://localhost:${port}/${apiPrefix}`);
  logger.log(`📋 ITIL v4 ITSM Platform is ready!`);
  logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

bootstrap().catch(err => {
  new Logger('Bootstrap').error('Failed to start application', err);
  process.exit(1);
});
