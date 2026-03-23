import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Không có quyền truy cập');
    }

    const hasRole = requiredRoles.some(role => user.role === role || user.roles?.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        `Cần có vai trò: ${requiredRoles.join(', ')} để thực hiện thao tác này`,
      );
    }

    return true;
  }
}
