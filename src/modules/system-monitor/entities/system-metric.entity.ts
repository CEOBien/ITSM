import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Sa Tăng gánh time-series metrics.
 * Không extends BaseEntity (không cần audit trail, soft delete, version cho time-series data).
 * Index trên timestamp vì mọi query đều filter theo khoảng thời gian.
 */
@Entity('system_metrics')
@Index(['timestamp'])
export class SystemMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({
    name: 'timestamp',
    type: 'timestamp with time zone',
    comment: 'Thời điểm thu thập snapshot',
  })
  timestamp: Date;

  // ─── CPU ──────────────────────────────────────────────────────────────────

  @Column({
    name: 'cpu_usage_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: 'Tổng CPU usage % (0-100)',
  })
  cpuUsagePercent: number;

  @Column({ name: 'cpu_cores', type: 'int', comment: 'Số lõi CPU logic' })
  cpuCores: number;

  @Column({
    name: 'load_avg_1m',
    type: 'decimal',
    precision: 6,
    scale: 2,
    default: 0,
    comment: 'Load average 1 phút (0 trên Windows)',
  })
  loadAvg1m: number;

  @Column({
    name: 'load_avg_5m',
    type: 'decimal',
    precision: 6,
    scale: 2,
    default: 0,
    comment: 'Load average 5 phút',
  })
  loadAvg5m: number;

  @Column({
    name: 'load_avg_15m',
    type: 'decimal',
    precision: 6,
    scale: 2,
    default: 0,
    comment: 'Load average 15 phút',
  })
  loadAvg15m: number;

  // ─── Memory ───────────────────────────────────────────────────────────────

  @Column({ name: 'memory_total_mb', type: 'int', comment: 'Tổng RAM hệ thống (MB)' })
  memoryTotalMb: number;

  @Column({ name: 'memory_used_mb', type: 'int', comment: 'RAM đang dùng (MB)' })
  memoryUsedMb: number;

  @Column({ name: 'memory_free_mb', type: 'int', comment: 'RAM còn trống (MB)' })
  memoryFreeMb: number;

  @Column({
    name: 'memory_usage_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: 'RAM usage % (0-100)',
  })
  memoryUsagePercent: number;

  // ─── Node.js Process ──────────────────────────────────────────────────────

  @Column({ name: 'heap_used_mb', type: 'int', comment: 'V8 Heap đang dùng (MB)' })
  heapUsedMb: number;

  @Column({ name: 'heap_total_mb', type: 'int', comment: 'V8 Heap được cấp phát (MB)' })
  heapTotalMb: number;

  @Column({ name: 'heap_external_mb', type: 'int', default: 0, comment: 'External memory (MB)' })
  heapExternalMb: number;

  @Column({ name: 'rss_mb', type: 'int', comment: 'Resident Set Size — tổng bộ nhớ process (MB)' })
  rssMb: number;

  // ─── Application ──────────────────────────────────────────────────────────

  @Column({
    name: 'active_connections',
    type: 'int',
    default: 0,
    comment: 'Số HTTP request đang xử lý',
  })
  activeConnections: number;

  @Column({
    name: 'requests_per_minute',
    type: 'int',
    default: 0,
    comment: 'Số request hoàn thành trong phút vừa rồi',
  })
  requestsPerMinute: number;

  @Column({
    name: 'error_count_per_minute',
    type: 'int',
    default: 0,
    comment: 'Số response lỗi (4xx, 5xx) trong phút vừa rồi',
  })
  errorCountPerMinute: number;

  // ─── Meta ─────────────────────────────────────────────────────────────────

  @Column({ name: 'uptime_seconds', type: 'int', comment: 'Thời gian process đã chạy (giây)' })
  uptimeSeconds: number;

  @Column({ name: 'node_version', length: 30, comment: 'Phiên bản Node.js' })
  nodeVersion: string;

  @Column({ name: 'platform', length: 20, comment: 'Hệ điều hành: win32 | linux | darwin' })
  platform: string;
}
