import { IsString, IsNotEmpty, MinLength, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Email hoặc username', example: 'admin@itsm.com' })
  @IsString()
  @IsNotEmpty({ message: 'Tài khoản không được để trống' })
  username: string;

  @ApiProperty({ description: 'Mật khẩu', example: 'Admin@123' })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Mật khẩu hiện tại' })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ description: 'Mật khẩu mới (tối thiểu 8 ký tự)' })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  newPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ description: 'Email đăng ký', example: 'user@example.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token đặt lại mật khẩu' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'Mật khẩu mới' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
