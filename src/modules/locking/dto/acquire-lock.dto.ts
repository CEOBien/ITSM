import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AcquireLockDto {
  @ApiPropertyOptional({
    example: 'tab_abc123xyz',
    description:
      'Browser session/tab ID để phân biệt nhiều tab của cùng một user. ' +
      'Nên tạo ngẫu nhiên ở FE khi user mở tab mới.',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  sessionId?: string;
}

export class HeartbeatDto {
  @ApiPropertyOptional({
    example: 'incident',
    description: 'Object type của bản ghi cần gia hạn lock',
  })
  @IsOptional()
  @IsString()
  objectType?: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'ID của bản ghi cần gia hạn lock',
  })
  @IsOptional()
  @IsString()
  objectId?: string;
}
