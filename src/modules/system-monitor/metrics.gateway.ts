import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from './metrics.service';

/**
 * Tôn Ngộ Không — WebSocket gateway cho real-time metrics streaming.
 * Namespace /system tách biệt khỏi các gateway khác.
 * Chỉ admin/super_admin mới được kết nối.
 */
@WebSocketGateway({
  namespace: '/system',
  cors: { origin: '*', credentials: true },
})
export class MetricsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(MetricsGateway.name);

  /** Danh sách socket đã xác thực — tránh broadcast tới client chưa auth */
  private readonly authenticatedClients = new Set<string>();

  constructor(
    private readonly metricsService: MetricsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      this.logger.warn(`WS /system: connection rejected — no token (${client.id})`);
      client.emit('error', { message: 'Token không hợp lệ' });
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const roles: string[] = payload.roles ?? [];
      if (!roles.includes('admin') && !roles.includes('super_admin')) {
        this.logger.warn(`WS /system: rejected — insufficient role (${payload.username})`);
        client.emit('error', { message: 'Không có quyền truy cập monitor' });
        client.disconnect();
        return;
      }

      this.authenticatedClients.add(client.id);
      this.logger.log(`WS /system: connected ${payload.username} (${client.id})`);

      // Gửi snapshot ngay khi kết nối thành công
      const snapshot = await this.metricsService.getCurrentSnapshot();
      client.emit('system:metrics', snapshot);
    } catch {
      client.emit('error', { message: 'Token không hợp lệ hoặc đã hết hạn' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.authenticatedClients.delete(client.id);
    this.logger.debug(`WS /system: disconnected (${client.id})`);
  }

  /** Broadcast metrics tới tất cả clients đã xác thực mỗi 5 giây */
  @Interval(5000)
  broadcastMetrics(): void {
    if (!this.server || this.authenticatedClients.size === 0) return;

    const snapshot = this.metricsService.getCachedSnapshot();
    if (!snapshot) return;

    const payload = { ...snapshot, timestamp: new Date() };
    this.server.to([...this.authenticatedClients]).emit('system:metrics', payload);

    // Phát cảnh báo nếu vượt ngưỡng
    const cpuThreshold =
      this.configService.get<number>('METRICS_CPU_ALERT_THRESHOLD') ?? 80;
    const memThreshold =
      this.configService.get<number>('METRICS_MEMORY_ALERT_THRESHOLD') ?? 85;

    if (snapshot.cpuUsagePercent > cpuThreshold) {
      this.server.to([...this.authenticatedClients]).emit('system:alert', {
        type: 'cpu',
        message: `CPU usage cao: ${snapshot.cpuUsagePercent}% (ngưỡng: ${cpuThreshold}%)`,
        value: snapshot.cpuUsagePercent,
        threshold: cpuThreshold,
        timestamp: new Date(),
      });
    }

    if (snapshot.memoryUsagePercent > memThreshold) {
      this.server.to([...this.authenticatedClients]).emit('system:alert', {
        type: 'memory',
        message: `Memory usage cao: ${snapshot.memoryUsagePercent}% (ngưỡng: ${memThreshold}%)`,
        value: snapshot.memoryUsagePercent,
        threshold: memThreshold,
        timestamp: new Date(),
      });
    }
  }

  /** Client có thể request snapshot bất kỳ lúc nào */
  @SubscribeMessage('system:request-snapshot')
  async handleRequestSnapshot(@ConnectedSocket() client: Socket): Promise<void> {
    if (!this.authenticatedClients.has(client.id)) {
      throw new WsException('Unauthorized');
    }
    const snapshot = await this.metricsService.getCurrentSnapshot();
    client.emit('system:metrics', snapshot);
  }

  getConnectedClientsCount(): number {
    return this.authenticatedClients.size;
  }
}
