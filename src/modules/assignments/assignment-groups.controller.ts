import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { AssignmentGroupsService } from './assignment-groups.service';
import { AssignmentPractice } from '../../common/enums';

@ApiTags('Assignment groups — Nhóm giao việc')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assignment-groups')
export class AssignmentGroupsController {
  constructor(private readonly service: AssignmentGroupsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách nhóm giao việc đang hoạt động' })
  @ApiQuery({
    name: 'practice',
    enum: AssignmentPractice,
    required: false,
    description: 'Lọc theo practice (mặc định: incidents)',
  })
  findAll(@Query('practice') practiceRaw?: string) {
    let practice = AssignmentPractice.INCIDENTS;
    if (practiceRaw != null && practiceRaw !== '') {
      const values = Object.values(AssignmentPractice) as string[];
      if (!values.includes(practiceRaw)) {
        throw new BadRequestException(`practice phải là một trong: ${values.join(', ')}`);
      }
      practice = practiceRaw as AssignmentPractice;
    }
    return this.service.findActiveByPractice(practice);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết một nhóm giao việc' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneActive(id);
  }
}
