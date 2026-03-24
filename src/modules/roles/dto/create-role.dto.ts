import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'it_manager', description: 'Mã vai trò (duy nhất, không dấu)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;

  @ApiProperty({ example: 'Trưởng phòng IT', description: 'Tên hiển thị' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả vai trò' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: false, description: 'Vai trò hệ thống (không xóa được)' })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [String], description: 'Danh sách ID permissions gán cho role' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds?: string[];
}

export class AssignPermissionsDto {
  @ApiProperty({ type: [String], description: 'Danh sách ID permissions' })
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds: string[];
}

export class AssignUserRoleDto {
  @ApiProperty({ description: 'ID vai trò' })
  @IsUUID()
  roleId: string;

  @ApiPropertyOptional({ description: 'ID đơn vị tổ chức (null = toàn hệ thống)' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}

export class RemoveUserRoleDto {
  @ApiProperty({ description: 'ID bản ghi user_role' })
  @IsUUID()
  userRoleId: string;
}
