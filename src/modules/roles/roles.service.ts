import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserRole } from './entities/user-role.entity';
import { CreateRoleDto, AssignPermissionsDto, AssignUserRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
  ) {}

  // ─── Roles ───────────────────────────────────────────────────────────────

  async createRole(dto: CreateRoleDto): Promise<Role> {
    const existing = await this.roleRepo.findOne({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`Role code "${dto.code}" đã tồn tại`);

    const role = this.roleRepo.create({
      code: dto.code,
      name: dto.name,
      description: dto.description,
      isSystem: dto.isSystem ?? false,
      isActive: dto.isActive ?? true,
    });

    if (dto.permissionIds?.length) {
      role.permissions = await this.permissionRepo.findBy({ id: In(dto.permissionIds) });
    } else {
      role.permissions = [];
    }

    return this.roleRepo.save(role);
  }

  async findAllRoles(): Promise<Role[]> {
    return this.roleRepo.find({
      relations: ['permissions'],
      order: { isSystem: 'DESC', name: 'ASC' },
    });
  }

  async findRoleById(id: string): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) throw new NotFoundException('Vai trò không tồn tại');
    return role;
  }

  async findRoleByCode(code: string): Promise<Role | null> {
    return this.roleRepo.findOne({ where: { code }, relations: ['permissions'] });
  }

  async updateRole(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findRoleById(id);

    if (role.isSystem && dto.isSystem === false) {
      throw new BadRequestException('Không thể gỡ trạng thái hệ thống khỏi vai trò mặc định');
    }

    Object.assign(role, dto);

    if (dto.permissionIds !== undefined) {
      role.permissions = dto.permissionIds?.length
        ? await this.permissionRepo.findBy({ id: In(dto.permissionIds) })
        : [];
    }

    return this.roleRepo.save(role);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.findRoleById(id);
    if (role.isSystem) {
      throw new BadRequestException('Không thể xóa vai trò hệ thống');
    }
    const assignedCount = await this.userRoleRepo.count({ where: { roleId: id } });
    if (assignedCount > 0) {
      throw new BadRequestException(
        `Vai trò đang được gán cho ${assignedCount} người dùng. Hãy gỡ gán trước khi xóa.`,
      );
    }
    await this.roleRepo.softRemove(role);
  }

  async assignPermissions(roleId: string, dto: AssignPermissionsDto): Promise<Role> {
    const role = await this.findRoleById(roleId);
    role.permissions = dto.permissionIds.length
      ? await this.permissionRepo.findBy({ id: In(dto.permissionIds) })
      : [];
    return this.roleRepo.save(role);
  }

  // ─── Permissions ─────────────────────────────────────────────────────────

  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionRepo.find({ order: { resource: 'ASC', action: 'ASC' } });
  }

  async findPermissionsByResource(resource: string): Promise<Permission[]> {
    return this.permissionRepo.find({ where: { resource }, order: { action: 'ASC' } });
  }

  // ─── User Roles ───────────────────────────────────────────────────────────

  async getUserRoles(userId: string): Promise<UserRole[]> {
    return this.userRoleRepo.find({
      where: { userId },
      relations: ['role', 'role.permissions', 'organization'],
    });
  }

  async assignRoleToUser(
    userId: string,
    dto: AssignUserRoleDto,
    assignedBy?: string,
  ): Promise<UserRole> {
    const role = await this.roleRepo.findOne({ where: { id: dto.roleId, isActive: true } });
    if (!role) throw new NotFoundException('Vai trò không tồn tại hoặc đã bị vô hiệu hóa');

    const duplicate = await this.userRoleRepo.findOne({
      where: {
        userId,
        roleId: dto.roleId,
        organizationId: dto.organizationId ?? undefined,
      },
    });
    if (duplicate) throw new ConflictException('Người dùng đã có vai trò này trong đơn vị này');

    const userRole = this.userRoleRepo.create({
      userId,
      roleId: dto.roleId,
      organizationId: dto.organizationId,
      createdBy: assignedBy,
    });

    return this.userRoleRepo.save(userRole);
  }

  async removeRoleFromUser(userRoleId: string): Promise<void> {
    const userRole = await this.userRoleRepo.findOne({ where: { id: userRoleId } });
    if (!userRole) throw new NotFoundException('Không tìm thấy bản ghi phân quyền');
    await this.userRoleRepo.remove(userRole);
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.userRoleRepo.find({
      where: { userId },
      relations: ['role', 'role.permissions'],
    });

    const permSet = new Set<string>();
    for (const ur of userRoles) {
      if (ur.role?.isActive) {
        for (const perm of ur.role.permissions ?? []) {
          permSet.add(perm.code);
        }
      }
    }
    return [...permSet];
  }

  async getUserRoleCodes(userId: string): Promise<string[]> {
    const userRoles = await this.userRoleRepo.find({
      where: { userId },
      relations: ['role'],
    });
    return [...new Set(userRoles.filter((ur) => ur.role?.isActive).map((ur) => ur.role.code))];
  }
}
