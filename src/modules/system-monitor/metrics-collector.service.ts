import { Injectable } from '@nestjs/common';
import * as os from 'os';

export interface RawMetricsSnapshot {
  cpuUsagePercent: number;
  cpuCores: number;
  loadAvg1m: number;
  loadAvg5m: number;
  loadAvg15m: number;
  memoryTotalMb: number;
  memoryUsedMb: number;
  memoryFreeMb: number;
  memoryUsagePercent: number;
  heapUsedMb: number;
  heapTotalMb: number;
  heapExternalMb: number;
  rssMb: number;
  uptimeSeconds: number;
  nodeVersion: string;
  platform: string;
}

/**
 * Tôn Ngộ Không — thu thập metrics thuần kỹ thuật từ Node.js built-in.
 * Không phụ thuộc database, không có side effects.
 */
@Injectable()
export class MetricsCollectorService {
  private previousCpuUsage = process.cpuUsage();
  private previousCpuTime = process.hrtime.bigint();

  /**
   * Lấy snapshot tài nguyên tại thời điểm gọi.
   * CPU usage được tính bằng delta so với lần đọc trước (~100ms).
   */
  async collect(): Promise<RawMetricsSnapshot> {
    const cpuUsagePercent = await this.measureCpuPercent();

    const memTotal = os.totalmem();
    const memFree = os.freemem();
    const memUsed = memTotal - memFree;

    const mem = process.memoryUsage();

    // Windows luôn trả [0,0,0] cho loadavg — graceful handle
    const [load1, load5, load15] = os.loadavg();

    return {
      cpuUsagePercent: parseFloat(cpuUsagePercent.toFixed(2)),
      cpuCores: os.cpus().length,
      loadAvg1m: parseFloat((load1 ?? 0).toFixed(2)),
      loadAvg5m: parseFloat((load5 ?? 0).toFixed(2)),
      loadAvg15m: parseFloat((load15 ?? 0).toFixed(2)),
      memoryTotalMb: this.toMb(memTotal),
      memoryUsedMb: this.toMb(memUsed),
      memoryFreeMb: this.toMb(memFree),
      memoryUsagePercent: parseFloat(((memUsed / memTotal) * 100).toFixed(2)),
      heapUsedMb: this.toMb(mem.heapUsed),
      heapTotalMb: this.toMb(mem.heapTotal),
      heapExternalMb: this.toMb(mem.external),
      rssMb: this.toMb(mem.rss),
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
    };
  }

  /**
   * CPU % = (userDelta + systemDelta) / (elapsedNs / 1000) * 100
   * Cần sample 100ms để có kết quả có nghĩa.
   */
  private async measureCpuPercent(): Promise<number> {
    const startUsage = process.cpuUsage();
    const startTime = process.hrtime.bigint();

    await this.sleep(100);

    const endUsage = process.cpuUsage(startUsage);
    const elapsedNs = Number(process.hrtime.bigint() - startTime);

    // cpuUsage trả microseconds, elapsed tính bằng nanoseconds
    const totalCpuMicros = endUsage.user + endUsage.system;
    const elapsedMicros = elapsedNs / 1000;

    const rawPercent = (totalCpuMicros / elapsedMicros) * 100;

    // Với multi-core, có thể > 100 — cap tại 100
    return Math.min(100, Math.max(0, rawPercent));
  }

  private toMb(bytes: number): number {
    return Math.round(bytes / 1024 / 1024);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
