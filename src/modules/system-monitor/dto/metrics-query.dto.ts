import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MetricsHistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Từ thời điểm (ISO 8601)',
    example: '2026-03-27T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Đến thời điểm (ISO 8601)',
    example: '2026-03-27T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: 'Số bản ghi tối đa trả về (max 1000)',
    default: 60,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 60;
}

export class MetricsSummaryQueryDto {
  @ApiProperty({
    description: 'Từ thời điểm (ISO 8601)',
    example: '2026-03-27T00:00:00.000Z',
  })
  @IsDateString()
  from: string;

  @ApiProperty({
    description: 'Đến thời điểm (ISO 8601)',
    example: '2026-03-27T23:59:59.000Z',
  })
  @IsDateString()
  to: string;
}

export class MetricsCleanupQueryDto {
  @ApiPropertyOptional({
    description: 'Xóa dữ liệu cũ hơn N ngày (default: theo METRICS_RETENTION_DAYS trong .env)',
    default: 7,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  olderThanDays?: number = 7;
}
