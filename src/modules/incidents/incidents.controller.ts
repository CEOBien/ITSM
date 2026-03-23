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
import { IncidentsService } from './incidents.service';
import {
  CreateIncidentDto,
  UpdateIncidentDto,
  ResolveIncidentDto,
  AssignIncidentDto,
  EscalateIncidentDto,
  IncidentFilterDto,
} from './dto/create-incident.dto';
import { PaginationDto } from '../../common/dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';
import { ICurrentUser } from '../../common/interfaces';

@ApiTags('Incidents - Quản lý sự cố (ITIL)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo sự cố mới' })
  create(@Body() dto: CreateIncidentDto, @CurrentUser() user: ICurrentUser) {
    return this.incidentsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách sự cố' })
  findAll(@Query() query: PaginationDto & IncidentFilterDto) {
    return this.incidentsService.findAll(query);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard sự cố - tổng quan nhanh' })
  getDashboard() {
    return this.incidentsService.getDashboard();
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SERVICE_DESK, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Thống kê sự cố theo trạng thái, ưu tiên, SLA' })
  getStats(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.incidentsService.getStats({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('number/:incidentNumber')
  @ApiOperation({ summary: 'Tìm sự cố theo mã số (VD: INC-20240321-000001)' })
  findByNumber(@Param('incidentNumber') incidentNumber: string) {
    return this.incidentsService.findByNumber(incidentNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết sự cố' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật sự cố' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIncidentDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.incidentsService.update(id, dto, user);
  }

  @Post(':id/assign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SERVICE_DESK)
  @ApiOperation({ summary: 'Giao sự cố cho kỹ thuật viên/nhóm' })
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignIncidentDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.incidentsService.assign(id, dto, user);
  }

  @Post(':id/escalate')
  @ApiOperation({ summary: 'Leo thang sự cố lên cấp cao hơn' })
  escalate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EscalateIncidentDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.incidentsService.escalate(id, dto, user);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Giải quyết sự cố' })
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveIncidentDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.incidentsService.resolve(id, dto, user);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Đóng sự cố (sau khi giải quyết)' })
  close(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: ICurrentUser) {
    return this.incidentsService.close(id, user);
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'Mở lại sự cố đã đóng' })
  reopen(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.incidentsService.reopen(id, reason, user);
  }
}
