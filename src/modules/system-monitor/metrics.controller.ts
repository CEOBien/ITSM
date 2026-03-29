import {
  Controller,
  Get,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { MetricsGateway } from './metrics.gateway';
import {
  MetricsHistoryQueryDto,
  MetricsSummaryQueryDto,
  MetricsCleanupQueryDto,
} from './dto/metrics-query.dto';
import { MetricsSnapshotDto } from './dto/metrics-snapshot.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { RequirePermissions } from '../../core/decorators/permissions.decorator';

/**
 * Trư Bát Giới — API contract cho monitoring dashboard.
 * Mọi endpoint yêu cầu admin/super_admin.
 */
@ApiTags('System Monitor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin', 'super_admin')
@RequirePermissions('settings:manage')
@Controller('system/metrics')
export class MetricsController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly metricsGateway: MetricsGateway,
  ) {}

  @Get('current')
  @ApiOperation({
    summary: 'Snapshot tài nguyên ngay lập tức',
    description: 'Lấy CPU, RAM, Heap, active connections tại thời điểm gọi. Không cần DB.',
  })
  @ApiOkResponse({ type: MetricsSnapshotDto })
  async getCurrent() {
    return this.metricsService.getCurrentSnapshot();
  }

  @Get('history')
  @ApiOperation({
    summary: 'Lịch sử metrics theo khoảng thời gian',
    description: 'Trả về các snapshot đã được persist vào DB mỗi phút. Max 1000 bản ghi.',
  })
  @ApiOkResponse({ type: [MetricsSnapshotDto] })
  async getHistory(@Query() query: MetricsHistoryQueryDto) {
    return this.metricsService.getHistory({
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      limit: query.limit,
    });
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Thống kê tổng hợp (avg / max / min) trong khoảng thời gian',
    description: 'Dùng để vẽ biểu đồ tổng quan — CPU trung bình, peak memory, tổng requests...',
  })
  getSummary(@Query() query: MetricsSummaryQueryDto) {
    return this.metricsService.getSummary(new Date(query.from), new Date(query.to));
  }

  @Get('websocket-info')
  @ApiOperation({
    summary: 'Thông tin WebSocket endpoint',
    description: 'Hướng dẫn kết nối WebSocket /system để nhận real-time metrics.',
  })
  @ApiOkResponse({
    schema: {
      example: {
        namespace: '/system',
        events: {
          subscribe: 'Kết nối với token JWT trong handshake.auth.token',
          'system:metrics': 'Broadcast mỗi 5 giây — payload: MetricsSnapshotDto',
          'system:alert': 'Phát khi CPU > 80% hoặc RAM > 85%',
          'system:request-snapshot': 'Gửi event này để request snapshot ngay',
        },
        connectedClients: 0,
      },
    },
  })
  getWebsocketInfo() {
    return {
      namespace: '/system',
      events: {
        connect: 'Kết nối với JWT token trong handshake.auth.token hoặc header Authorization',
        'system:metrics': 'Nhận metrics broadcast mỗi 5 giây',
        'system:alert': 'Nhận cảnh báo khi CPU/RAM vượt ngưỡng',
        'system:request-snapshot': 'Gửi để yêu cầu snapshot ngay lập tức',
      },
      thresholds: {
        cpu: '80%',
        memory: '85%',
      },
      connectedClients: this.metricsGateway.getConnectedClientsCount(),
    };
  }

  @Delete('cleanup')
  @Roles('super_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xóa dữ liệu metrics cũ (chỉ super_admin)',
    description: 'Xóa thủ công các snapshot cũ hơn N ngày để tiết kiệm dung lượng.',
  })
  @ApiResponse({ status: 200, schema: { example: { deleted: 1440, message: 'Đã xóa 1440 snapshots' } } })
  async cleanup(@Query() query: MetricsCleanupQueryDto) {
    const deleted = await this.metricsService.manualCleanup(query.olderThanDays ?? 7);
    return { deleted, message: `Đã xóa ${deleted} snapshots cũ hơn ${query.olderThanDays} ngày` };
  }
}
