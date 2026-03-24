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
import { ServiceRequestsService } from './service-requests.service';
import {
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
  ApproveRequestDto,
  FulfillRequestDto,
} from './dto/create-service-request.dto';
import { PaginationDto } from '../../common/dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { RequestStatus } from '../../common/enums';
import { ICurrentUser } from '../../common/interfaces';

@ApiTags('Service Requests - Quản lý yêu cầu dịch vụ (ITIL)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo yêu cầu dịch vụ mới' })
  create(@Body() dto: CreateServiceRequestDto, @CurrentUser() user: ICurrentUser) {
    return this.serviceRequestsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách yêu cầu dịch vụ' })
  findAll(@Query() query: PaginationDto & { status?: RequestStatus }) {
    return this.serviceRequestsService.findAll(query);
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Yêu cầu của tôi' })
  getMyRequests(@Query() query: PaginationDto, @CurrentUser() user: ICurrentUser) {
    return this.serviceRequestsService.getMyRequests(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết yêu cầu dịch vụ' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceRequestsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật yêu cầu dịch vụ' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceRequestDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.serviceRequestsService.update(id, dto, user);
  }

  @Post(':id/approve')
  @Roles('approver', 'change_manager', 'admin', 'super_admin')
  @ApiOperation({ summary: 'Phê duyệt/từ chối yêu cầu dịch vụ' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveRequestDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.serviceRequestsService.approve(id, dto, user);
  }

  @Post(':id/fulfill')
  @Roles('service_desk', 'technician', 'admin', 'super_admin')
  @ApiOperation({ summary: 'Hoàn thành yêu cầu dịch vụ' })
  fulfill(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FulfillRequestDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.serviceRequestsService.fulfill(id, dto, user);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Hủy yêu cầu dịch vụ' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.serviceRequestsService.cancel(id, reason, user);
  }
}
