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
import { SlaService, CreateSlaDto } from './sla.service';
import { PaginationDto } from '../../common/dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';
import { ICurrentUser } from '../../common/interfaces';

@ApiTags('SLA - Service Level Management (ITIL)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sla')
export class SlaController {
  constructor(private readonly slaService: SlaService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Tạo SLA/OLA mới' })
  create(@Body() dto: CreateSlaDto, @CurrentUser() user: ICurrentUser) {
    return this.slaService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách SLA' })
  findAll(@Query() query: PaginationDto & { type?: string; isActive?: boolean }) {
    return this.slaService.findAll(query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Danh sách SLA đang active theo loại ticket' })
  findActive(@Query('ticketType') ticketType: string) {
    return this.slaService.findActive(ticketType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết SLA' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.slaService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cập nhật SLA' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateSlaDto>,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.slaService.update(id, dto, user);
  }

  @Post(':id/toggle-active')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Kích hoạt/Tắt SLA' })
  toggleActive(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: ICurrentUser) {
    return this.slaService.toggleActive(id, user);
  }

  @Get(':id/performance')
  @ApiOperation({ summary: 'Báo cáo hiệu suất SLA' })
  getPerformanceReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.slaService.getPerformanceReport(id, new Date(startDate), new Date(endDate));
  }
}
