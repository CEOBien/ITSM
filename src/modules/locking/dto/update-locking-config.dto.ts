import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';
import { CreateLockingConfigDto } from './create-locking-config.dto';

export class UpdateLockingConfigDto extends PartialType(CreateLockingConfigDto) {
  @ApiProperty({
    example: 1,
    description:
      'Version hiện tại của bản ghi (optimistic locking). ' +
      'Lấy từ GET response, gửi lên khi update để phát hiện xung đột đồng thời.',
  })
  @IsNotEmpty()
  @IsInt()
  version: number;
}
