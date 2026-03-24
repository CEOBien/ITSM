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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CmdbService } from './cmdb.service';
import { CreateCiDto, UpdateCiDto, AddRelationshipDto } from './dto/create-ci.dto';
import { PaginationDto } from '../../common/dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { CiStatus } from '../../common/enums';
import { ICurrentUser } from '../../common/interfaces';

@ApiTags('CMDB - Configuration Management Database (ITIL)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cmdb')
export class CmdbController {
  constructor(private readonly cmdbService: CmdbService) {}

  @Post()
  @Roles('asset_manager', 'admin', 'super_admin')
  @ApiOperation({ summary: 'Thêm Configuration Item (CI) mới vào CMDB' })
  create(@Body() dto: CreateCiDto, @CurrentUser() user: ICurrentUser) {
    return this.cmdbService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách Configuration Items' })
  findAll(
    @Query()
    query: PaginationDto & {
      type?: string;
      status?: CiStatus;
      ownerId?: string;
      environment?: string;
    },
  ) {
    return this.cmdbService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Thống kê CMDB' })
  getStats() {
    return this.cmdbService.getStats();
  }

  @Get('number/:ciNumber')
  @ApiOperation({ summary: 'Tìm CI theo mã số' })
  findByCiNumber(@Param('ciNumber') ciNumber: string) {
    return this.cmdbService.findByCiNumber(ciNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết CI' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmdbService.findOne(id);
  }

  @Get(':id/impact')
  @ApiOperation({ summary: 'Xem các CI bị ảnh hưởng khi CI này gặp sự cố (Impact Analysis)' })
  getImpactedCis(@Param('id', ParseUUIDPipe) id: string) {
    return this.cmdbService.getImpactedCis(id);
  }

  @Patch(':id')
  @Roles('asset_manager', 'admin', 'super_admin')
  @ApiOperation({ summary: 'Cập nhật CI' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCiDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.cmdbService.update(id, dto, user);
  }

  @Post(':id/relationships')
  @Roles('asset_manager', 'admin', 'super_admin')
  @ApiOperation({ summary: 'Thêm quan hệ giữa các CI' })
  addRelationship(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddRelationshipDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.cmdbService.addRelationship(id, dto, user);
  }

  @Delete(':id/relationships/:relatedCiId')
  @Roles('asset_manager', 'admin', 'super_admin')
  @ApiOperation({ summary: 'Xóa quan hệ CI' })
  removeRelationship(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('relatedCiId', ParseUUIDPipe) relatedCiId: string,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.cmdbService.removeRelationship(id, relatedCiId, user);
  }

  @Post(':id/retire')
  @Roles('asset_manager', 'admin', 'super_admin')
  @ApiOperation({ summary: 'Retire (ngừng sử dụng) một CI' })
  retire(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: ICurrentUser) {
    return this.cmdbService.retire(id, user);
  }
}
