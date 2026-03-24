import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import {
  CreateRoleDto,
  AssignPermissionsDto,
  AssignUserRoleDto,
  RemoveUserRoleDto,
} from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { RequirePermissions } from '../../core/decorators/permissions.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { ICurrentUser } from '../../common/interfaces';

@ApiTags('Roles & Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // ─── Roles ───────────────────────────────────────────────────────────────

  @Post()
  @Roles('super_admin', 'admin')
  @RequirePermissions('roles:create')
  @ApiOperation({ summary: 'Tạo vai trò mới' })
  createRole(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto);
  }

  @Get()
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'Lấy danh sách tất cả vai trò' })
  findAllRoles() {
    return this.rolesService.findAllRoles();
  }

  @Get('permissions')
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'Lấy toàn bộ danh sách quyền trong hệ thống' })
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Get(':id')
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'Lấy thông tin vai trò theo ID' })
  findRole(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findRoleById(id);
  }

  @Patch(':id')
  @Roles('super_admin', 'admin')
  @RequirePermissions('roles:update')
  @ApiOperation({ summary: 'Cập nhật thông tin vai trò' })
  updateRole(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.updateRole(id, dto);
  }

  @Post(':id/permissions')
  @Roles('super_admin', 'admin')
  @RequirePermissions('roles:update')
  @ApiOperation({ summary: 'Gán danh sách permissions cho role (ghi đè toàn bộ)' })
  assignPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(id, dto);
  }

  @Delete(':id')
  @Roles('super_admin')
  @RequirePermissions('roles:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa vai trò (không áp dụng cho vai trò hệ thống)' })
  deleteRole(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.deleteRole(id);
  }

  // ─── User Role assignments ────────────────────────────────────────────────

  @Get('user/:userId')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'Lấy danh sách vai trò của một người dùng' })
  getUserRoles(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.rolesService.getUserRoles(userId);
  }

  @Post('user/:userId/assign')
  @Roles('super_admin', 'admin')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Gán vai trò cho người dùng (có thể gắn đơn vị tổ chức)' })
  assignRoleToUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: AssignUserRoleDto,
    @CurrentUser() currentUser: ICurrentUser,
  ) {
    return this.rolesService.assignRoleToUser(userId, dto, currentUser.id);
  }

  @Delete('user/assignment/:userRoleId')
  @Roles('super_admin', 'admin')
  @RequirePermissions('users:manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Gỡ vai trò khỏi người dùng' })
  removeRoleFromUser(@Param('userRoleId', ParseUUIDPipe) userRoleId: string) {
    return this.rolesService.removeRoleFromUser(userRoleId);
  }
}
