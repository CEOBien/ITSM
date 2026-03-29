import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Cron, Interval } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { SystemMetric } from './entities/system-metric.entity';
import { MetricsCollectorService, RawMetricsSnapshot } from './metrics-collector.service';
import { ActiveRequestsInterceptor } from '../../core/interceptors/active-requests.interceptor';

export interface MetricsSummary {
  from: Date;
  to: Date;
  totalSnapshots: number;
  cpu: { avg: number; max: number; min: number };
  memory: { avg: number; max: number; min: number };
  heap: { avg: number; max: number; min: number };
  requestsPerMinute: { avg: number; max: number; total: number };
  errorsPerMinute: { avg: number; max: number; total: number };
}

/**
 * Tôn Ngộ Không — business logic cho metrics.
 * Điều phối collect → persist → query → cleanup.
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  /** Cache snapshot mới nhất để WebSocket broadcast không cần query DB */
  private latestSnapshot: (RawMetricsSnapshot & {
    activeConnections: number;
    requestsPerMinute: number;
    errorCountPerMinute: number;
  }) | null = null;

  constructor(
    @InjectRepository(SystemMetric)
    private readonly metricsRepo: Repository<SystemMetric>,
    private readonly collector: MetricsCollectorService,
    private readonly activeRequestsInterceptor: ActiveRequestsInterceptor,
    private readonly configService: ConfigService,
  ) {}

  // ─── Scheduled Jobs ────────────────────────────────────────────────────────

  /** Refresh cache mỗi 5 giây cho WebSocket broadcast */
  @Interval(5000)
  async refreshCache(): Promise<void> {
    try {
      const raw = await this.collector.collect();
      this.latestSnapshot = {
        ...raw,
        activeConnections: this.activeRequestsInterceptor.getActiveConnections(),
        requestsPerMinute: this.activeRequestsInterceptor.getLastMinuteRequests(),
        errorCountPerMinute: this.activeRequestsInterceptor.getLastMinuteErrors(),
      };
    } catch (err) {
      this.logger.warn(`Failed to refresh metrics cache: ${(err as Error).message}`);
    }
  }

  /** Persist snapshot vào DB mỗi phút */
  @Cron('0 * * * * *')
  async persistSnapshot(): Promise<void> {
    try {
      const raw = await this.collector.collect();
      const metric = this.metricsRepo.create({
        ...raw,
        activeConnections: this.activeRequestsInterceptor.getActiveConnections(),
        requestsPerMinute: this.activeRequestsInterceptor.getLastMinuteRequests(),
        errorCountPerMinute: this.activeRequestsInterceptor.getLastMinuteErrors(),
      });
      await this.metricsRepo.save(metric);
    } catch (err) {
      this.logger.error(`Failed to persist metrics: ${(err as Error).message}`);
    }
  }

  /** Cleanup records cũ mỗi giờ */
  @Cron('0 0 * * * *')
  async cleanupOldRecords(): Promise<void> {
    const retentionDays = this.configService.get<number>('METRICS_RETENTION_DAYS') ?? 7;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    const { affected } = await this.metricsRepo.delete({ timestamp: LessThan(cutoff) });
    if (affected && affected > 0) {
      this.logger.log(`Cleaned up ${affected} metric snapshots older than ${retentionDays} days`);
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /** Snapshot ngay lập tức — dùng cache nếu còn mới (<10s), không cần DB */
  async getCurrentSnapshot(): Promise<RawMetricsSnapshot & {
    activeConnections: number;
    requestsPerMinute: number;
    errorCountPerMinute: number;
    timestamp: Date;
  }> {
    if (this.latestSnapshot) {
      return { ...this.latestSnapshot, timestamp: new Date() };
    }
    // Lần đầu tiên — collect trực tiếp
    const raw = await this.collector.collect();
    return {
      ...raw,
      activeConnections: this.activeRequestsInterceptor.getActiveConnections(),
      requestsPerMinute: this.activeRequestsInterceptor.getLastMinuteRequests(),
      errorCountPerMinute: this.activeRequestsInterceptor.getLastMinuteErrors(),
      timestamp: new Date(),
    };
  }

  /** Lấy cached snapshot cho WebSocket broadcast (không tốn CPU đo lại) */
  getCachedSnapshot() {
    return this.latestSnapshot;
  }

  async getHistory(params: {
    from?: Date;
    to?: Date;
    limit?: number;
  }): Promise<SystemMetric[]> {
    const { from, to, limit = 100 } = params;
    const cappedLimit = Math.min(limit, 1000);

    const where: Record<string, unknown> = {};
    if (from && to) {
      where.timestamp = Between(from, to);
    } else if (from) {
      where.timestamp = Between(from, new Date());
    }

    return this.metricsRepo.find({
      where,
      order: { timestamp: 'DESC' },
      take: cappedLimit,
    });
  }

  async getSummary(from: Date, to: Date): Promise<MetricsSummary> {
    const result = await this.metricsRepo
      .createQueryBuilder('m')
      .select([
        'COUNT(*) AS "totalSnapshots"',
        'AVG(m.cpu_usage_percent)::numeric(5,2) AS "cpuAvg"',
        'MAX(m.cpu_usage_percent)::numeric(5,2) AS "cpuMax"',
        'MIN(m.cpu_usage_percent)::numeric(5,2) AS "cpuMin"',
        'AVG(m.memory_usage_percent)::numeric(5,2) AS "memAvg"',
        'MAX(m.memory_usage_percent)::numeric(5,2) AS "memMax"',
        'MIN(m.memory_usage_percent)::numeric(5,2) AS "memMin"',
        'AVG(m.heap_used_mb)::numeric(8,2) AS "heapAvg"',
        'MAX(m.heap_used_mb) AS "heapMax"',
        'MIN(m.heap_used_mb) AS "heapMin"',
        'AVG(m.requests_per_minute)::numeric(8,2) AS "rpmAvg"',
        'MAX(m.requests_per_minute) AS "rpmMax"',
        'SUM(m.requests_per_minute) AS "rpmTotal"',
        'AVG(m.error_count_per_minute)::numeric(8,2) AS "errAvg"',
        'MAX(m.error_count_per_minute) AS "errMax"',
        'SUM(m.error_count_per_minute) AS "errTotal"',
      ])
      .where('m.timestamp BETWEEN :from AND :to', { from, to })
      .getRawOne();

    return {
      from,
      to,
      totalSnapshots: parseInt(result?.totalSnapshots ?? '0', 10),
      cpu: {
        avg: parseFloat(result?.cpuAvg ?? '0'),
        max: parseFloat(result?.cpuMax ?? '0'),
        min: parseFloat(result?.cpuMin ?? '0'),
      },
      memory: {
        avg: parseFloat(result?.memAvg ?? '0'),
        max: parseFloat(result?.memMax ?? '0'),
        min: parseFloat(result?.memMin ?? '0'),
      },
      heap: {
        avg: parseFloat(result?.heapAvg ?? '0'),
        max: parseInt(result?.heapMax ?? '0', 10),
        min: parseInt(result?.heapMin ?? '0', 10),
      },
      requestsPerMinute: {
        avg: parseFloat(result?.rpmAvg ?? '0'),
        max: parseInt(result?.rpmMax ?? '0', 10),
        total: parseInt(result?.rpmTotal ?? '0', 10),
      },
      errorsPerMinute: {
        avg: parseFloat(result?.errAvg ?? '0'),
        max: parseInt(result?.errMax ?? '0', 10),
        total: parseInt(result?.errTotal ?? '0', 10),
      },
    };
  }

  async manualCleanup(olderThanDays: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    const { affected } = await this.metricsRepo.delete({ timestamp: LessThan(cutoff) });
    return affected ?? 0;
  }
}
