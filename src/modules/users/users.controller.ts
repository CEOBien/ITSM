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
import { Roles } from '../../core/decorators/roles.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { ApiPaginatedResponse } from '../../core/decorators/api-paginated.decorator';
import { UserRole, UserStatus } from '../../common/enums';
import { ICurrentUser } from '../../common/interfaces';
import { User } from './entities/user.entity';

@ApiTags('Users - Quản lý người dùng')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Tạo người dùng mới' })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: ICurrentUser) {
    return this.usersService.create(dto, user);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SERVICE_DESK)
  @ApiOperation({ summary: 'Danh sách người dùng' })
  @ApiPaginatedResponse(User)
  findAll(
    @Query() query: PaginationDto & { role?: string; status?: string; departmentId?: string },
  ) {
    return this.usersService.findAll(query);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Thống kê người dùng' })
  getStats() {
    return this.usersService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết người dùng' })
  @ApiParam({ name: 'id', description: 'User ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cập nhật người dùng' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
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
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa người dùng' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: ICurrentUser) {
    return this.usersService.remove(id, user);
  }
}
