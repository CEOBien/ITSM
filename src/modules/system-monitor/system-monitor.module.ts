import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SystemMetric } from './entities/system-metric.entity';
import { MetricsCollectorService } from './metrics-collector.service';
import { MetricsService } from './metrics.service';
import { MetricsGateway } from './metrics.gateway';
import { MetricsController } from './metrics.controller';
import { ActiveRequestsInterceptor } from '../../core/interceptors/active-requests.interceptor';

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemMetric]),
    // JwtModule dùng để gateway xác thực WebSocket connection
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: configService.get<string>('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [MetricsController],
  providers: [
    MetricsCollectorService,
    MetricsService,
    MetricsGateway,
    // ActiveRequestsInterceptor đăng ký là provider để có thể inject
    ActiveRequestsInterceptor,
  ],
  exports: [MetricsService, ActiveRequestsInterceptor],
})
export class SystemMonitorModule {}
