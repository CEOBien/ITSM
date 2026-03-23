import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsArray,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority, Impact, ChangeType, ChangeStatus } from '../../../common/enums';

export class CreateChangeDto {
  @ApiProperty({ description: 'Tiêu đề thay đổi', example: 'Nâng cấp SQL Server 2019 lên 2022' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Mô tả chi tiết thay đổi' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Lý do cần thay đổi (Business Justification)' })
  @IsString()
  @IsNotEmpty()
  justification: string;

  @ApiPropertyOptional({ enum: ChangeType, default: ChangeType.NORMAL })
  @IsOptional()
  @IsEnum(ChangeType)
  type?: ChangeType;

  @ApiPropertyOptional({ enum: Priority, default: Priority.MEDIUM })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({ enum: Impact })
  @IsOptional()
  @IsEnum(Impact)
  impact?: Impact;

  @ApiPropertyOptional({ description: 'Danh mục thay đổi', example: 'Software Upgrade' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Dịch vụ bị ảnh hưởng' })
  @IsOptional()
  @IsString()
  service?: string;

  @ApiPropertyOptional({
    description: 'Mức độ rủi ro',
    enum: ['low', 'medium', 'high', 'critical'],
  })
  @IsOptional()
  @IsString()
  riskLevel?: string;

  @ApiPropertyOptional({ description: 'Đánh giá rủi ro chi tiết' })
  @IsOptional()
  @IsString()
  riskAssessment?: string;

  @ApiPropertyOptional({ description: 'Kế hoạch rollback' })
  @IsOptional()
  @IsString()
  rollbackPlan?: string;

  @ApiPropertyOptional({ description: 'Kế hoạch kiểm thử' })
  @IsOptional()
  @IsString()
  testPlan?: string;

  @ApiPropertyOptional({ description: 'Kế hoạch triển khai' })
  @IsOptional()
  @IsString()
  implementationPlan?: string;

  @ApiPropertyOptional({ description: 'Thời gian bắt đầu dự kiến (ISO string)' })
  @IsOptional()
  @IsDateString()
  scheduledStartDate?: string;

  @ApiPropertyOptional({ description: 'Thời gian kết thúc dự kiến (ISO string)' })
  @IsOptional()
  @IsDateString()
  scheduledEndDate?: string;

  @ApiPropertyOptional({ description: 'ID Change Manager' })
  @IsOptional()
  @IsUUID()
  changeManagerId?: string;

  @ApiPropertyOptional({ description: 'ID người thực hiện' })
  @IsOptional()
  @IsUUID()
  implementerId?: string;

  @ApiPropertyOptional({ description: 'Danh sách CI bị ảnh hưởng' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  affectedCiIds?: string[];

  @ApiPropertyOptional({ description: 'Sự cố liên quan' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  relatedIncidentIds?: string[];
}

export class UpdateChangeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ChangeStatus })
  @IsOptional()
  @IsEnum(ChangeStatus)
  status?: ChangeStatus;

  @ApiPropertyOptional({ enum: Priority })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  riskAssessment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rollbackPlan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledStartDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledEndDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  implementationNotes?: string;
}

export class ApproveChangeDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsEnum(['approved', 'rejected'])
  decision: 'approved' | 'rejected';

  @ApiPropertyOptional({ description: 'Ghi chú phê duyệt' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class ImplementChangeDto {
  @ApiPropertyOptional({ description: 'Ghi chú thực hiện' })
  @IsOptional()
  @IsString()
  implementationNotes?: string;
}

export class CloseChangeDto {
  @ApiProperty({
    description: 'Kết quả triển khai',
    enum: ['successful', 'unsuccessful', 'cancelled'],
  })
  @IsString()
  @IsNotEmpty()
  closureCode: string;

  @ApiPropertyOptional({ description: 'Đánh giá sau triển khai (PIR)' })
  @IsOptional()
  @IsString()
  postImplementationReview?: string;

  @ApiPropertyOptional({ description: 'Lý do thất bại (nếu unsuccessful)' })
  @IsOptional()
  @IsString()
  failureReason?: string;
}
