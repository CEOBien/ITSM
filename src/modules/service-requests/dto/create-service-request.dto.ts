import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority, RequestStatus } from '../../../common/enums';

export class CreateServiceRequestDto {
  @ApiProperty({
    description: 'Tiêu đề yêu cầu',
    example: 'Yêu cầu cấp quyền truy cập hệ thống SAP',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Mô tả chi tiết yêu cầu' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'ID catalog item' })
  @IsOptional()
  @IsUUID()
  catalogItemId?: string;

  @ApiPropertyOptional({ description: 'Danh mục yêu cầu', example: 'Access Request' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: Priority, default: Priority.LOW })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({ description: 'Yêu cầu thay cho ai (UUID)' })
  @IsOptional()
  @IsUUID()
  onBehalfOfId?: string;

  @ApiPropertyOptional({
    description: 'Dữ liệu form catalog',
    example: { system: 'SAP', accessLevel: 'read' },
  })
  @IsOptional()
  @IsObject()
  formData?: Record<string, any>;
}

export class UpdateServiceRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: RequestStatus })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fulfillmentNotes?: string;
}

export class ApproveRequestDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsEnum(['approved', 'rejected'])
  decision: 'approved' | 'rejected';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class FulfillRequestDto {
  @ApiProperty({ description: 'Ghi chú hoàn thành' })
  @IsString()
  @IsNotEmpty()
  fulfillmentNotes: string;
}
