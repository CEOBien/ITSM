import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsArray,
  IsBoolean,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority, Impact, Urgency, IncidentStatus } from '../../../common/enums';
import { SEED_INCIDENT_REFERENCE } from '../../../database/seeds/seed-reference-uuids';

/** Client/Swagger hay gửi "" thay vì omit field — @IsOptional không bỏ qua chuỗi rỗng */
function EmptyToUndefined() {
  return Transform(({ value }: { value: unknown }) =>
    value === '' || value === null ? undefined : value,
  );
}

/** Tags: tránh [""] fail @IsString each */
function StringArrayOrUndefined() {
  return Transform(({ value }: { value: unknown }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    if (!Array.isArray(value)) return value;
    const next = value
      .map((v) => (typeof v === 'string' ? v.trim() : v))
      .filter((v) => v !== '');
    return next.length ? next : undefined;
  });
}

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

  @ApiProperty({
    description:
      'UUID user được giao xử lý (phải tồn tại). Sau `npm run seed`: user `technician` dùng UUID cố định.',
    example: SEED_INCIDENT_REFERENCE.ASSIGNEE_USER_ID,
  })
  @IsUUID('4', { message: 'assigneeId phải là UUID v4 hợp lệ' })
  @IsNotEmpty({ message: 'Phải chọn người xử lý (assigneeId)' })
  assigneeId: string;

  @ApiProperty({
    description:
      'UUID nhóm giao việc (`assignment_groups`). Lấy từ GET /assignment-groups hoặc sau seed: `INC-L1-SD`.',
    example: SEED_INCIDENT_REFERENCE.ASSIGNMENT_GROUP_ID,
  })
  @IsUUID('4', { message: 'assigneeGroupId phải là UUID v4 hợp lệ' })
  @IsNotEmpty({ message: 'Phải chọn nhóm xử lý (assigneeGroupId)' })
  assigneeGroupId: string;

  @ApiProperty({
    description:
      'Danh sách CI trong CMDB bị ảnh hưởng (ít nhất 1). Sau seed: CI-DEMO-ERP-01, CI-DEMO-MAIL-01.',
    type: [String],
    example: [
      SEED_INCIDENT_REFERENCE.CI_ERP_SERVER_ID,
      SEED_INCIDENT_REFERENCE.CI_MAIL_SERVICE_ID,
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Cần ít nhất một CI trong affectedCiIds' })
  @IsUUID('4', { each: true, message: 'Mỗi phần tử affectedCiIds phải là UUID v4' })
  affectedCiIds: string[];

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
  @StringArrayOrUndefined()
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
  @EmptyToUndefined()
  @IsOptional()
  @IsUUID('4')
  assigneeId?: string;

  @ApiPropertyOptional()
  @EmptyToUndefined()
  @IsOptional()
  @IsUUID('4')
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
  @EmptyToUndefined()
  @IsOptional()
  @IsUUID('4')
  knowledgeArticleId?: string;
}

export class AssignIncidentDto {
  @ApiPropertyOptional({ description: 'ID người được giao' })
  @EmptyToUndefined()
  @IsOptional()
  @IsUUID('4')
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'ID nhóm được giao' })
  @EmptyToUndefined()
  @IsOptional()
  @IsUUID('4')
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
  @EmptyToUndefined()
  @IsOptional()
  @IsUUID('4')
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
  @EmptyToUndefined()
  @IsOptional()
  @IsUUID('4')
  assigneeId?: string;

  @ApiPropertyOptional()
  @EmptyToUndefined()
  @IsOptional()
  @IsUUID('4')
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
