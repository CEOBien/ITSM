import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsArray,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority, Impact, Urgency, IncidentStatus } from '../../../common/enums';

export class CreateIncidentDto {
  @ApiProperty({ description: 'Tiêu đề sự cố', example: 'Không thể đăng nhập hệ thống ERP' })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @MaxLength(500)
  title: string;

  @ApiProperty({
    description: 'Mô tả chi tiết sự cố',
    example: 'Từ 8h sáng, tất cả user phòng Kế toán không đăng nhập được...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  description: string;

  @ApiPropertyOptional({
    description: 'Mức độ ảnh hưởng',
    enum: Impact,
    default: Impact.INDIVIDUAL,
  })
  @IsOptional()
  @IsEnum(Impact)
  impact?: Impact = Impact.INDIVIDUAL;

  @ApiPropertyOptional({ description: 'Mức độ khẩn cấp', enum: Urgency, default: Urgency.MEDIUM })
  @IsOptional()
  @IsEnum(Urgency)
  urgency?: Urgency = Urgency.MEDIUM;

  @ApiPropertyOptional({ description: 'Danh mục', example: 'Hardware' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Danh mục con', example: 'Laptop' })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiPropertyOptional({ description: 'Dịch vụ bị ảnh hưởng', example: 'Email Service' })
  @IsOptional()
  @IsString()
  service?: string;

  @ApiPropertyOptional({ description: 'ID người được giao' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'ID nhóm xử lý' })
  @IsOptional()
  @IsUUID()
  assigneeGroupId?: string;

  @ApiPropertyOptional({ description: 'ID CI bị ảnh hưởng' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  affectedCiIds?: string[];

  @ApiPropertyOptional({
    description: 'Nguồn tiếp nhận',
    example: 'portal',
    enum: ['portal', 'email', 'phone', 'auto', 'chat'],
  })
  @IsOptional()
  @IsString()
  source?: string = 'portal';

  @ApiPropertyOptional({ description: 'Sự cố nghiêm trọng?', default: false })
  @IsOptional()
  @IsBoolean()
  isMajorIncident?: boolean;

  @ApiPropertyOptional({ description: 'Tags', example: ['erp', 'login'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateIncidentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: IncidentStatus })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @ApiPropertyOptional({ enum: Impact })
  @IsOptional()
  @IsEnum(Impact)
  impact?: Impact;

  @ApiPropertyOptional({ enum: Urgency })
  @IsOptional()
  @IsEnum(Urgency)
  urgency?: Urgency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  service?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeGroupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pendingReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  onHoldReason?: string;
}

export class ResolveIncidentDto {
  @ApiProperty({ description: 'Giải pháp xử lý', example: 'Restart IIS service trên server web01' })
  @IsString()
  @IsNotEmpty({ message: 'Giải pháp không được để trống' })
  resolution: string;

  @ApiPropertyOptional({ description: 'Nguyên nhân gốc rễ' })
  @IsOptional()
  @IsString()
  rootCause?: string;

  @ApiPropertyOptional({
    description: 'Mã đóng sự cố',
    enum: ['resolved', 'user_error', 'no_fault_found', 'known_error', 'workaround'],
  })
  @IsOptional()
  @IsString()
  closureCode?: string;

  @ApiPropertyOptional({ description: 'ID bài viết KB áp dụng' })
  @IsOptional()
  @IsUUID()
  knowledgeArticleId?: string;
}

export class AssignIncidentDto {
  @ApiPropertyOptional({ description: 'ID người được giao' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'ID nhóm được giao' })
  @IsOptional()
  @IsUUID()
  assigneeGroupId?: string;

  @ApiPropertyOptional({ description: 'Ghi chú khi giao' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class EscalateIncidentDto {
  @ApiProperty({
    description: 'Lý do leo thang',
    example: 'Sự cố ảnh hưởng toàn công ty, cần kỹ thuật cấp cao',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ description: 'ID người tiếp nhận sau leo thang' })
  @IsOptional()
  @IsUUID()
  escalateTo?: string;
}

export class AddCommentDto {
  @ApiProperty({
    description: 'Nội dung ghi chú',
    example: 'Đã liên hệ người dùng để thu thập thêm thông tin',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Hiển thị cho người dùng?', default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = true;
}

export class IncidentFilterDto {
  @ApiPropertyOptional({ enum: IncidentStatus, isArray: true })
  @IsOptional()
  status?: IncidentStatus | IncidentStatus[];

  @ApiPropertyOptional({ enum: Priority, isArray: true })
  @IsOptional()
  priority?: Priority | Priority[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  reporterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Từ ngày (ISO string)' })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Đến ngày (ISO string)' })
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Chỉ xem SLA đã vi phạm' })
  @IsOptional()
  @IsBoolean()
  slaBreached?: boolean;

  @ApiPropertyOptional({ description: 'Chỉ xem Major Incidents' })
  @IsOptional()
  @IsBoolean()
  isMajorIncident?: boolean;
}
