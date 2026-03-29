import { SetMetadata } from '@nestjs/common';
import { ObjectType } from '@modules/locking/enums/locking.enum';
import { LOCKABLE_KEY } from '@modules/locking/locking.constants';

/**
 * Đánh dấu một route cần kiểm tra locking trước khi xử lý.
 *
 * LockingGuard sẽ đọc metadata này và kiểm tra xem bản ghi
 * có đang bị lock bởi người khác không.
 *
 * Chỉ áp dụng cho các operation WRITE (PATCH, POST action, DELETE).
 * Không cần thiết cho GET endpoints.
 *
 * @example
 * ```typescript
 * @Patch(':id')
 * @Lockable(ObjectType.INCIDENT)
 * update(@Param('id') id: string, ...) { ... }
 * ```
 */
export const Lockable = (objectType: ObjectType) => SetMetadata(LOCKABLE_KEY, objectType);
