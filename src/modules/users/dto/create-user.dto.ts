import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MinLength,
  IsBoolean,
  IsUUID,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums';

export class CreateUserDto {
  @ApiPropertyOptional({ description: 'Mã nhân viên', example: 'EMP001' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiProperty({ description: 'Tên đăng nhập', example: 'nguyen.van.a' })
  @IsString()
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'Tên đăng nhập chỉ được chứa chữ cái, số, dấu chấm, gạch dưới, gạch ngang',
  })
  username: string;

  @ApiProperty({ description: 'Email', example: 'nguyen.van.a@company.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Họ và tên', example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  fullName: string;

  @ApiProperty({ description: 'Mật khẩu (tối thiểu 8 ký tự)', example: 'Password@123' })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  password: string;

  @ApiPropertyOptional({ description: 'Vai trò', enum: UserRole, default: UserRole.END_USER })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Vai trò không hợp lệ' })
  role?: UserRole = UserRole.END_USER;

  @ApiPropertyOptional({ description: 'Số điện thoại' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại di động' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ description: 'Chức danh', example: 'Kỹ sư IT' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'ID phòng ban' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'ID quản lý trực tiếp' })
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiPropertyOptional({ description: 'Địa điểm làm việc', example: 'Hà Nội - Tầng 5' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Người dùng VIP', default: false })
  @IsOptional()
  @IsBoolean()
  isVip?: boolean;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVip?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notificationEmail?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notificationSms?: boolean;
}
