import { ApiProperty } from '@nestjs/swagger';

/** Shape của response cho một snapshot metrics */
export class MetricsSnapshotDto {
  @ApiProperty({ example: '2026-03-27T00:01:00.000Z' })
  timestamp: Date;

  @ApiProperty({ description: 'CPU usage %', example: 12.5 })
  cpuUsagePercent: number;

  @ApiProperty({ description: 'Số lõi CPU', example: 8 })
  cpuCores: number;

  @ApiProperty({ description: 'Load average 1 phút (0 trên Windows)', example: 0.42 })
  loadAvg1m: number;

  @ApiProperty({ example: 0.38 })
  loadAvg5m: number;

  @ApiProperty({ example: 0.31 })
  loadAvg15m: number;

  @ApiProperty({ description: 'Tổng RAM hệ thống (MB)', example: 16384 })
  memoryTotalMb: number;

  @ApiProperty({ description: 'RAM đang dùng (MB)', example: 8192 })
  memoryUsedMb: number;

  @ApiProperty({ description: 'RAM còn trống (MB)', example: 8192 })
  memoryFreeMb: number;

  @ApiProperty({ description: 'RAM usage %', example: 50.0 })
  memoryUsagePercent: number;

  @ApiProperty({ description: 'V8 Heap đang dùng (MB)', example: 128 })
  heapUsedMb: number;

  @ApiProperty({ description: 'V8 Heap được cấp phát (MB)', example: 256 })
  heapTotalMb: number;

  @ApiProperty({ description: 'External memory (MB)', example: 10 })
  heapExternalMb: number;

  @ApiProperty({ description: 'RSS — tổng bộ nhớ process (MB)', example: 350 })
  rssMb: number;

  @ApiProperty({ description: 'Số HTTP request đang xử lý', example: 5 })
  activeConnections: number;

  @ApiProperty({ description: 'Requests hoàn thành trong phút vừa rồi', example: 120 })
  requestsPerMinute: number;

  @ApiProperty({ description: 'Số lỗi 4xx/5xx trong phút vừa rồi', example: 2 })
  errorCountPerMinute: number;

  @ApiProperty({ description: 'Process uptime (giây)', example: 3600 })
  uptimeSeconds: number;

  @ApiProperty({ example: 'v20.11.0' })
  nodeVersion: string;

  @ApiProperty({ example: 'linux' })
  platform: string;
}
