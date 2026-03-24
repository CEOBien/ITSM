import { Entity, Column, Index, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Role } from './role.entity';

@Entity('permissions')
@Index(['code'], { unique: true })
@Index(['resource', 'action'], { unique: true })
export class Permission extends BaseEntity {
  @Column({ name: 'code', unique: true, comment: 'Mã quyền: resource:action (vd: incidents:create)' })
  code: string;

  @Column({ name: 'resource', comment: 'Tài nguyên (vd: incidents, users, changes)' })
  resource: string;

  @Column({ name: 'action', comment: 'Hành động (vd: create, read, update, delete, manage)' })
  action: string;

  @Column({ name: 'description', nullable: true, comment: 'Mô tả quyền' })
  description?: string;

  @Column({ name: 'group_name', nullable: true, comment: 'Nhóm quyền để hiển thị UI' })
  groupName?: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
