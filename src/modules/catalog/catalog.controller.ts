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
import { CatalogService, CreateCatalogItemDto } from './catalog.service';
import { PaginationDto } from '../../common/dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';
import { ICurrentUser } from '../../common/interfaces';

@ApiTags('Catalog - Service Catalogue (ITIL)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Tạo catalog item mới' })
  create(@Body() dto: CreateCatalogItemDto, @CurrentUser() user: ICurrentUser) {
    return this.catalogService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Danh mục dịch vụ (Service Catalogue)' })
  findAll(
    @Query()
    query: PaginationDto & { category?: string; isActive?: boolean; isVisibleToUsers?: boolean },
  ) {
    return this.catalogService.findAll(query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Danh sách category dịch vụ' })
  getCategories() {
    return this.catalogService.getCategories();
  }

  @Get('popular')
  @ApiOperation({ summary: 'Dịch vụ được yêu cầu nhiều nhất' })
  getPopular(@Query('limit') limit?: number) {
    return this.catalogService.getPopular(limit || 10);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Tìm dịch vụ theo mã' })
  findByCode(@Param('code') code: string) {
    return this.catalogService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết dịch vụ catalog' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalogService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cập nhật catalog item' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateCatalogItemDto>,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.catalogService.update(id, dto, user);
  }

  @Post(':id/toggle-active')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Kích hoạt/Tắt dịch vụ' })
  toggleActive(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: ICurrentUser) {
    return this.catalogService.toggleActive(id, user);
  }
}
