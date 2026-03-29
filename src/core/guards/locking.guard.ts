import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LockingService } from '@modules/locking/locking.service';
import { ObjectType } from '@modules/locking/enums/locking.enum';
import { LOCKABLE_KEY } from '@modules/locking/locking.constants';
import { ICurrentUser } from '@common/interfaces';

/**
 * Guard bảo vệ write endpoints khỏi xung đột locking.
 *
 * Hoạt động:
 * 1. Đọc @Lockable(ObjectType.X) từ route handler
 * 2. Lấy :id từ params (assume param name là 'id')
 * 3. Kiểm tra có lock đang active bởi người khác không
 * 4. Nếu có → throw 423 Locked với thông tin người giữ lock
 * 5. Nếu không → cho phép request đi tiếp
 *
 * Guard KHÔNG tự acquire lock — việc đó là trách nhiệm của FE
 * qua endpoint POST /locking/:objectType/:objectId/acquire.
 *
 * Đăng ký toàn cục trong AppModule via APP_GUARD để tự động
 * áp dụng cho mọi controller có @Lockable decorator.
 */
@Injectable()
export class LockingGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly lockingService: LockingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const objectType = this.reflector.getAllAndOverride<ObjectType>(LOCKABLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!objectType) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as ICurrentUser;
    const objectId: string = request.params?.id;

    if (!objectId || !user) return true;

    const lockInfo = await this.lockingService.checkCanEdit(objectType, objectId, user.id);

    if (lockInfo) {
      throw new HttpException(
        {
          statusCode: 423,
          message: `Bản ghi đang được chỉnh sửa bởi ${lockInfo.lockedByName}. Vui lòng thử lại sau khi họ hoàn thành.`,
          data: lockInfo,
        },
        423,
      );
    }

    return true;
  }
}
