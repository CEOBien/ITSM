import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsArray,
  IsNumber,
  IsDateString,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CiStatus } from '../../../common/enums';
import { Type } from 'class-transformer';

export class CreateCiDto {
  @ApiProperty({ description: 'Tên CI', example: 'WEB-SRV-01' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Loại CI',
    example: 'server',
    enum: ['server', 'workstation', 'laptop', 'network_device', 'software', 'service', 'database'],
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({ description: 'Loại con', example: 'physical' })
  @IsOptional()
  @IsString()
  subtype?: string;

  @ApiPropertyOptional({ description: 'Mô tả' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'ID người chịu trách nhiệm' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Vị trí vật lý', example: 'Hà Nội - Phòng máy chủ T5' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Nhà sản xuất', example: 'Dell' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Model', example: 'PowerEdge R740' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Serial Number' })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ description: 'Địa chỉ IP' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Hostname' })
  @IsOptional()
  @IsString()
  hostname?: string;

  @ApiPropertyOptional({ description: 'Hệ điều hành', example: 'Windows Server 2022' })
  @IsOptional()
  @IsString()
  operatingSystem?: string;

  @ApiPropertyOptional({ description: 'RAM (GB)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ramGb?: number;

  @ApiPropertyOptional({ description: 'Storage (GB)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  storageGb?: number;

  @ApiPropertyOptional({ description: 'Ngày mua (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional({ description: 'Hạn bảo hành (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  warrantyExpiry?: string;

  @ApiPropertyOptional({ description: 'Giá mua' })
  @IsOptional()
  @IsNumber()
  purchaseCost?: number;

  @ApiPropertyOptional({
    description: 'Môi trường',
    enum: ['production', 'staging', 'development', 'test'],
  })
  @IsOptional()
  @IsString()
  environment?: string;

  @ApiPropertyOptional({
    description: 'Mức độ quan trọng',
    enum: ['critical', 'high', 'medium', 'low'],
  })
  @IsOptional()
  @IsString()
  criticality?: string;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Thuộc tính bổ sung (JSON)' })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;
}

export class UpdateCiDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: CiStatus })
  @IsOptional()
  @IsEnum(CiStatus)
  status?: CiStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;
}

export class AddRelationshipDto {
  @ApiProperty({ description: 'ID CI liên quan' })
  @IsUUID()
  relatedCiId: string;

  @ApiProperty({ description: 'Tên CI liên quan (để hiển thị)' })
  @IsString()
  relatedCiName: string;

  @ApiProperty({
    description: 'Loại quan hệ',
    example: 'depends_on',
    enum: ['depends_on', 'connected_to', 'runs_on', 'hosts', 'parent_of', 'child_of', 'member_of'],
  })
  @IsString()
  relationshipType: string;

  @ApiProperty({ enum: ['upstream', 'downstream'] })
  @IsEnum(['upstream', 'downstream'])
  direction: 'upstream' | 'downstream';
}
