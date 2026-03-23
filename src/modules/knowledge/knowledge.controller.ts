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
import { KnowledgeService, CreateArticleDto } from './knowledge.service';
import { PaginationDto } from '../../common/dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { UserRole, KnowledgeStatus } from '../../common/enums';
import { ICurrentUser } from '../../common/interfaces';

@ApiTags('Knowledge - Quản lý tri thức (ITIL Knowledge Management)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo bài viết kiến thức mới' })
  create(@Body() dto: CreateArticleDto, @CurrentUser() user: ICurrentUser) {
    return this.knowledgeService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách bài viết kiến thức' })
  findAll(
    @Query() query: PaginationDto & { status?: KnowledgeStatus; category?: string; type?: string },
  ) {
    return this.knowledgeService.findAll(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Tìm kiếm bài viết kiến thức' })
  search(@Query('q') keyword: string, @Query('limit') limit?: number) {
    return this.knowledgeService.search(keyword, limit || 10);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Bài viết nổi bật' })
  getFeatured(@Query('limit') limit?: number) {
    return this.knowledgeService.getFeatured(limit || 5);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Bài viết được dùng nhiều nhất' })
  getPopular(@Query('limit') limit?: number) {
    return this.knowledgeService.getPopular(limit || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết bài viết' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const article = await this.knowledgeService.findOne(id);
    await this.knowledgeService.incrementViewCount(id);
    return article;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật bài viết' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateArticleDto>,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.knowledgeService.update(id, dto, user);
  }

  @Post(':id/submit-review')
  @ApiOperation({ summary: 'Gửi bài viết để review' })
  submitForReview(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: ICurrentUser) {
    return this.knowledgeService.submitForReview(id, user);
  }

  @Post(':id/publish')
  @Roles(UserRole.KNOWLEDGE_MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Xuất bản bài viết' })
  publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: ICurrentUser) {
    return this.knowledgeService.publish(id, user);
  }

  @Post(':id/archive')
  @Roles(UserRole.KNOWLEDGE_MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Archive bài viết' })
  archive(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: ICurrentUser) {
    return this.knowledgeService.archive(id, user);
  }

  @Post(':id/helpful')
  @ApiOperation({ summary: 'Đánh giá bài viết có hữu ích không' })
  rateHelpful(@Param('id', ParseUUIDPipe) id: string, @Body('isHelpful') isHelpful: boolean) {
    return this.knowledgeService.rateHelpful(id, isHelpful);
  }
}
