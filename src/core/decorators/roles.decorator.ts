import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
/** Gắn danh sách mã vai trò yêu cầu lên route. Sử dụng string code (vd: 'admin', 'super_admin'). */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
