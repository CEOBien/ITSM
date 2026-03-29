import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { LockingService } from './locking.service';
import { CreateLockingConfigDto } from './dto/create-locking-config.dto';
import { UpdateLockingConfigDto } from './dto/update-locking-config.dto';
import { AcquireLockDto } from './dto/acquire-lock.dto';
import { ObjectType } from './enums/locking.enum';
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard';
import { RolesGuard } from '@core/guards/roles.guard';
import { Roles } from '@core/decorators/roles.decorator';
import { CurrentUser } from '@core/decorators/current-user.decorator';
import { ICurrentUser } from '@common/interfaces';
import { ROLES } from '@common/constants';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('locking')
export class LockingController {
  constructor(private readonly lockingService: LockingService) {}

  // ============================================================
  // Admin — Quản lý cấu hình locking
  // ============================================================

  @Get('configs')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @ApiTags('Locking — Admin Config')
  @ApiOperation({
    summary: 'Danh sách cấu hình locking theo object type',
    description: 'Chỉ super_admin và admin mới có quyền xem cấu hình.',
  })
  findAllConfigs() {
    return this.lockingService.findAllConfigs();
  }

  @Post('configs')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiTags('Locking — Admin Config')
  @ApiOperation({
    summary: 'Tạo cấu hình locking cho một object type',
    description: 'Mỗi object type chỉ có một cấu hình. Tạo lại sẽ báo lỗi 409.',
  })
  @ApiResponse({ status: 409, description: 'Object type này đã có cấu hình' })
  createConfig(@Body() dto: CreateLockingConfigDto, @CurrentUser() user: ICurrentUser) {
    return this.lockingService.createConfig(dto, user);
  }

  @Patch('configs/:id')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @ApiTags('Locking — Admin Config')
  @ApiOperation({
    summary: 'Cập nhật cấu hình locking',
    description: 'Bắt buộc gửi kèm version để phát hiện xung đột đồng thời.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 409, description: 'Version conflict — config đã bị thay đổi bởi người khác' })
  updateConfig(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLockingConfigDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.lockingService.updateConfig(id, dto, user);
  }

  @Delete('configs/:id')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiTags('Locking — Admin Config')
  @ApiOperation({ summary: 'Xóa cấu hình locking (soft delete)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  deleteConfig(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.lockingService.deleteConfig(id, user.id);
  }

  // ============================================================
  // Lock Operations — dùng bởi FE khi mở/đóng form edit
  // ============================================================

  @Get(':objectType/:objectId/status')
  @ApiTags('Locking — Operations')
  @ApiOperation({
    summary: 'Kiểm tra trạng thái lock của một bản ghi',
    description:
      'FE gọi trước khi hiển thị nút Edit. Nếu isLocked=true và isOwnLock=false → chỉ hiển thị view mode.',
  })
  @ApiParam({ name: 'objectType', enum: ObjectType, example: ObjectType.INCIDENT })
  @ApiParam({ name: 'objectId', type: String, format: 'uuid' })
  checkStatus(
    @Param('objectType') objectType: ObjectType,
    @Param('objectId', ParseUUIDPipe) objectId: string,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.lockingService.checkLockStatus(objectType, objectId, user.id);
  }

  @Post(':objectType/:objectId/acquire')
  @ApiTags('Locking — Operations')
  @ApiOperation({
    summary: 'Acquire lock khi mở form edit',
    description:
      'FE gọi ngay khi user bấm nút "Chỉnh sửa". ' +
      'Nếu bản ghi đang bị lock bởi người khác → 423 Locked với thông tin người giữ lock.',
  })
  @ApiParam({ name: 'objectType', enum: ObjectType, example: ObjectType.INCIDENT })
  @ApiParam({ name: 'objectId', type: String, format: 'uuid' })
  @ApiResponse({ status: 423, description: 'Bản ghi đang bị lock bởi người khác' })
  acquireLock(
    @Param('objectType') objectType: ObjectType,
    @Param('objectId', ParseUUIDPipe) objectId: string,
    @Body() dto: AcquireLockDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.lockingService.acquireLock(objectType, objectId, user, dto.sessionId);
  }

  @Delete(':objectType/:objectId/release')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiTags('Locking — Operations')
  @ApiOperation({
    summary: 'Release lock khi Save hoặc Cancel form',
    description:
      'FE gọi khi user bấm Save, Cancel hoặc đóng tab (beforeunload). ' +
      'Admin có thể force-release lock của người khác.',
  })
  @ApiParam({ name: 'objectType', enum: ObjectType, example: ObjectType.INCIDENT })
  @ApiParam({ name: 'objectId', type: String, format: 'uuid' })
  releaseLock(
    @Param('objectType') objectType: ObjectType,
    @Param('objectId', ParseUUIDPipe) objectId: string,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.lockingService.releaseLock(objectType, objectId, user);
  }

  @Post(':objectType/:objectId/heartbeat')
  @ApiTags('Locking — Operations')
  @ApiOperation({
    summary: 'Gia hạn lock để tránh tự động expire',
    description:
      'FE gọi mỗi 5 phút trong khi form đang mở. ' +
      'Nếu lock đã hết hạn → 404, FE cần acquire lại.',
  })
  @ApiParam({ name: 'objectType', enum: ObjectType, example: ObjectType.INCIDENT })
  @ApiParam({ name: 'objectId', type: String, format: 'uuid' })
  @ApiResponse({ status: 404, description: 'Lock không tồn tại hoặc đã hết hạn' })
  heartbeat(
    @Param('objectType') objectType: ObjectType,
    @Param('objectId', ParseUUIDPipe) objectId: string,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.lockingService.heartbeat(objectType, objectId, user.id);
  }
}
