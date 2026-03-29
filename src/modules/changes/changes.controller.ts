import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChangesService } from './changes.service';
import {
  CreateChangeDto,
  UpdateChangeDto,
  ApproveChangeDto,
  ImplementChangeDto,
  CloseChangeDto,
} from './dto/create-change.dto';
import { PaginationDto } from '@common/dto';
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard';
import { RolesGuard } from '@core/guards/roles.guard';
import { Roles } from '@core/decorators/roles.decorator';
import { CurrentUser } from '@core/decorators/current-user.decorator';
import { Lockable } from '@core/decorators/lockable.decorator';
import { ChangeStatus, ChangeType } from '@common/enums';
import { ICurrentUser } from '@common/interfaces';
import { ObjectType } from '@modules/locking/enums/locking.enum';

@ApiTags('Changes - Quản lý thay đổi (ITIL Change Enablement)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('changes')
export class ChangesController {
  constructor(private readonly changesService: ChangesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo Change Request mới' })
  create(@Body() dto: CreateChangeDto, @CurrentUser() user: ICurrentUser) {
    return this.changesService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách Change Requests' })
  findAll(@Query() query: PaginationDto & { status?: ChangeStatus; type?: ChangeType }) {
    return this.changesService.findAll(query);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Lịch triển khai Change (Forward Schedule of Changes)' })
  getCalendar(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.changesService.getCalendar(new Date(startDate), new Date(endDate));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết Change Request' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.changesService.findOne(id);
  }

  @Patch(':id')
  @Lockable(ObjectType.CHANGE)
  @ApiOperation({ summary: 'Cập nhật Change Request' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChangeDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.changesService.update(id, dto, user);
  }

  @Post(':id/submit')
  @Lockable(ObjectType.CHANGE)
  @ApiOperation({ summary: 'Gửi Change để phê duyệt' })
  submit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: ICurrentUser) {
    return this.changesService.submit(id, user);
  }

  @Post(':id/approve')
  @Roles('change_manager', 'approver', 'super_admin', 'admin')
  @ApiOperation({ summary: 'Phê duyệt hoặc từ chối Change (CAB Decision)' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveChangeDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.changesService.approve(id, dto, user);
  }

  @Post(':id/implement')
  @Roles('change_manager', 'technician', 'super_admin')
  @ApiOperation({ summary: 'Bắt đầu triển khai Change' })
  implement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ImplementChangeDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.changesService.implement(id, dto, user);
  }

  @Post(':id/close')
  @Roles('change_manager', 'super_admin', 'admin')
  @ApiOperation({ summary: 'Đóng Change (PIR - Post Implementation Review)' })
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseChangeDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.changesService.close(id, dto, user);
  }
}
