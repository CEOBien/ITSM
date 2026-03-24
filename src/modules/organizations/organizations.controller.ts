import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { PermissionsGuard } from '../../core/guards/permissions.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { RequirePermissions } from '../../core/decorators/permissions.decorator';
import { OrgType } from './entities/organization.entity';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Post()
  @Roles('super_admin', 'admin')
  @RequirePermissions('organizations:create')
  @ApiOperation({ summary: 'Tạo đơn vị tổ chức mới' })
  create(@Body() dto: CreateOrganizationDto) {
    return this.service.create(dto);
  }

  @Get()
  @RequirePermissions('organizations:read')
  @ApiOperation({ summary: 'Lấy danh sách toàn bộ đơn vị tổ chức' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.service.findAll(includeInactive === 'true');
  }

  @Get('tree')
  @RequirePermissions('organizations:read')
  @ApiOperation({ summary: 'Lấy cây tổ chức (từ cấp 1 → cấp 3)' })
  findTree() {
    return this.service.findTree();
  }

  @Get('by-type/:type')
  @RequirePermissions('organizations:read')
  @ApiOperation({ summary: 'Lấy danh sách đơn vị theo loại' })
  findByType(@Param('type') type: OrgType) {
    return this.service.findByType(type);
  }

  @Get(':id')
  @RequirePermissions('organizations:read')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết đơn vị tổ chức' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('super_admin', 'admin')
  @RequirePermissions('organizations:update')
  @ApiOperation({ summary: 'Cập nhật thông tin đơn vị tổ chức' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrganizationDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('super_admin', 'admin')
  @RequirePermissions('organizations:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa đơn vị tổ chức (soft delete)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
