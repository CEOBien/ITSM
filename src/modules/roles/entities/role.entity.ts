import { Entity, Column, Index, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Permission } from './permission.entity';
import { UserRole } from './user-role.entity';

@Entity('roles')
@Index(['code'], { unique: true })
export class Role extends BaseEntity {
  @Column({ name: 'code', unique: true, comment: 'Mã vai trò (vd: super_admin, service_desk)' })
  code: string;

  @Column({ name: 'name', comment: 'Tên hiển thị vai trò' })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true, comment: 'Mô tả vai trò' })
  description?: string;

  @Column({
    name: 'is_system',
    default: false,
    comment: 'Vai trò hệ thống — không được xóa',
  })
  isSystem: boolean;

  @Column({ name: 'is_active', default: true, comment: 'Trạng thái kích hoạt' })
  isActive: boolean;

  @ManyToMany(() => Permission, (permission) => permission.roles, { eager: false })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles: UserRole[];
}
