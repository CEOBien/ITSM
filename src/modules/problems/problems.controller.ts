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
import { ProblemsService } from './problems.service';
import {
  CreateProblemDto,
  UpdateProblemDto,
  RegisterKnownErrorDto,
  ResolveProblemDto,
} from './dto/create-problem.dto';
import { PaginationDto } from '../../common/dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { UserRole, ProblemStatus } from '../../common/enums';
import { ICurrentUser } from '../../common/interfaces';

@ApiTags('Problems - Quản lý vấn đề (ITIL)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROBLEM_MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Tạo problem record mới' })
  create(@Body() dto: CreateProblemDto, @CurrentUser() user: ICurrentUser) {
    return this.problemsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách problem records' })
  findAll(@Query() query: PaginationDto & { status?: ProblemStatus; isKnownError?: boolean }) {
    return this.problemsService.findAll(query);
  }

  @Get('known-errors')
  @ApiOperation({ summary: 'Known Error Database (KEDB)' })
  getKnownErrors(@Query() query: PaginationDto) {
    return this.problemsService.getKnownErrors(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết problem record' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.problemsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROBLEM_MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Cập nhật problem record' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProblemDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.problemsService.update(id, dto, user);
  }

  @Post(':id/known-error')
  @Roles(UserRole.PROBLEM_MANAGER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Đăng ký vào Known Error Database (KEDB)' })
  registerKnownError(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegisterKnownErrorDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.problemsService.registerKnownError(id, dto, user);
  }

  @Post(':id/investigate')
  @ApiOperation({ summary: 'Thêm ghi chú điều tra' })
  addInvestigationNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('content') content: string,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.problemsService.addInvestigationNote(id, content, user);
  }

  @Post(':id/resolve')
  @Roles(UserRole.PROBLEM_MANAGER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Giải quyết problem' })
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveProblemDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.problemsService.resolve(id, dto, user);
  }

  @Post(':id/close')
  @Roles(UserRole.PROBLEM_MANAGER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Đóng problem record' })
  close(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: ICurrentUser) {
    return this.problemsService.close(id, user);
  }
}
