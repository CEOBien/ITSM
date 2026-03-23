import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority, Impact, ProblemStatus } from '../../../common/enums';

export class CreateProblemDto {
  @ApiProperty({
    description: 'Tiêu đề vấn đề',
    example: 'Email server thường xuyên bị treo vào giờ cao điểm',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Mô tả chi tiết' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ enum: Priority, default: Priority.MEDIUM })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({ enum: Impact })
  @IsOptional()
  @IsEnum(Impact)
  impact?: Impact;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  service?: string;

  @ApiPropertyOptional({ description: 'ID người phụ trách' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Danh sách sự cố liên quan' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  relatedIncidentIds?: string[];

  @ApiPropertyOptional({ description: 'Danh sách CI bị ảnh hưởng' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  affectedCiIds?: string[];
}

export class UpdateProblemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ProblemStatus })
  @IsOptional()
  @IsEnum(ProblemStatus)
  status?: ProblemStatus;

  @ApiPropertyOptional({ enum: Priority })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Nguyên nhân gốc rễ' })
  @IsOptional()
  @IsString()
  rootCause?: string;

  @ApiPropertyOptional({ description: 'Giải pháp tạm thời' })
  @IsOptional()
  @IsString()
  workaround?: string;

  @ApiPropertyOptional({ description: 'Giải pháp vĩnh viễn' })
  @IsOptional()
  @IsString()
  permanentFix?: string;
}

export class RegisterKnownErrorDto {
  @ApiProperty({ description: 'Mô tả Known Error' })
  @IsString()
  @IsNotEmpty()
  errorDescription: string;

  @ApiProperty({ description: 'Giải pháp tạm thời (workaround)' })
  @IsString()
  @IsNotEmpty()
  workaround: string;

  @ApiPropertyOptional({ description: 'Giải pháp vĩnh viễn' })
  @IsOptional()
  @IsString()
  permanentFix?: string;
}

export class ResolveProblemDto {
  @ApiProperty({ description: 'Giải pháp áp dụng' })
  @IsString()
  @IsNotEmpty()
  resolution: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rootCause?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  relatedChangeId?: string;
}
