import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { PaginationDto } from '../../common/dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { RequirePermissions } from '../../core/decorators/permissions.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { ApiPaginatedResponse } from '../../core/decorators/api-paginated.decorator';
import { UserStatus } from '../../common/enums';
import { ICurrentUser } from '../../common/interfaces';
import { User } from './entities/user.entity';

@ApiTags('Users - Quản lý người dùng')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('super_admin', 'admin')
  @RequirePermissions('users:create')
  @ApiOperation({ summary: 'Tạo người dùng mới' })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: ICurrentUser) {
    return this.usersService.create(dto, user);
  }

  @Get()
  @Roles('super_admin', 'admin', 'service_desk')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'Danh sách người dùng' })
  @ApiPaginatedResponse(User)
  findAll(
    @Query() query: PaginationDto & { status?: string; organizationId?: string; roleCode?: string },
  ) {
    return this.usersService.findAll(query);
  }

  @Get('stats')
  @Roles('super_admin', 'admin')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'Thống kê người dùng' })
  getStats() {
    return this.usersService.getStats();
  }

  @Get(':id')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'Chi tiết người dùng' })
  @ApiParam({ name: 'id', description: 'User ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles('super_admin', 'admin')
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'Cập nhật người dùng' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Patch(':id/status')
  @Roles('super_admin', 'admin')
  @RequirePermissions('users:update')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cập nhật trạng thái người dùng' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: UserStatus,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.usersService.updateStatus(id, status, user);
  }

  @Delete(':id')
  @Roles('super_admin', 'admin')
  @RequirePermissions('users:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa người dùng' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: ICurrentUser) {
    return this.usersService.remove(id, user);
  }
}
