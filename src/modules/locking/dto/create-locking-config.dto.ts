import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  Min,
  Max,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LockingMode, ObjectType, ConditionOperator, LogicalOperator } from '../enums/locking.enum';

export class ConditionRuleDto {
  @ApiProperty({
    example: 'status',
    description: 'Tên field của bản ghi cần kiểm tra (hỗ trợ cả camelCase và snake_case)',
  })
  @IsString()
  field: string;

  @ApiProperty({
    enum: ConditionOperator,
    example: ConditionOperator.NOT_IN,
    description: 'Toán tử so sánh',
  })
  @IsEnum(ConditionOperator)
  op: ConditionOperator;

  @ApiPropertyOptional({
    example: ['resolved', 'closed', 'cancelled'],
    description: 'Giá trị so sánh. Với op=in/not_in thì là mảng, còn lại là giá trị đơn.',
  })
  @IsOptional()
  value?: string | string[] | number | boolean | null;
}

export class LockConditionsDto {
  @ApiProperty({
    enum: LogicalOperator,
    example: LogicalOperator.AND,
    description: 'Toán tử logic kết hợp các rules (AND/OR)',
  })
  @IsEnum(LogicalOperator)
  operator: LogicalOperator;

  @ApiProperty({
    type: [ConditionRuleDto],
    description: 'Danh sách rules. Có thể lồng nhau (nested group) bằng cách dùng cùng cấu trúc này.',
    example: [{ field: 'status', op: 'not_in', value: ['resolved', 'closed', 'cancelled'] }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionRuleDto)
  rules: ConditionRuleDto[];
}

export class CreateLockingConfigDto {
  @ApiProperty({
    enum: ObjectType,
    example: ObjectType.INCIDENT,
    description: 'Loại object cần cấu hình locking. Mỗi object type chỉ có một cấu hình.',
  })
  @IsEnum(ObjectType)
  objectType: ObjectType;

  @ApiProperty({
    enum: LockingMode,
    example: LockingMode.PESSIMISTIC,
    description:
      'Chế độ locking. none=không lock, optimistic=kiểm tra version khi save, pessimistic=khóa khi mở edit, both=cả hai.',
  })
  @IsEnum(LockingMode)
  lockingMode: LockingMode;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Bật/tắt locking cho object type này',
  })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean = true;

  @ApiPropertyOptional({
    example: 30,
    default: 30,
    description: 'Thời gian lock tự động hết hạn tính bằng phút. Chỉ áp dụng cho pessimistic/both mode.',
    minimum: 5,
    maximum: 480,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  lockTimeoutMins?: number = 30;

  @ApiPropertyOptional({
    type: LockConditionsDto,
    description:
      'Điều kiện để quyết định bản ghi có cần lock không. Để null = luôn lock mọi bản ghi. ' +
      'Ví dụ: chỉ lock khi status không phải resolved/closed.',
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LockConditionsDto)
  conditions?: LockConditionsDto;

  @ApiPropertyOptional({
    example: ['service_desk', 'technician'],
    description: 'Danh sách role bị áp dụng locking. Để null = áp dụng cho tất cả roles.',
    nullable: true,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applyToRoles?: string[];

  @ApiPropertyOptional({
    example: 'Lock Incident khi đang ở trạng thái In Progress hoặc Pending',
    description: 'Mô tả mục đích của cấu hình này',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
