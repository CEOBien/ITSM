import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { LockConditions } from '../interfaces/locking.interface';
import { LockingMode, ObjectType } from '../enums/locking.enum';

/**
 * Cấu hình locking per object type.
 * Admin có thể bật/tắt, chọn mode, đặt timeout và điều kiện áp dụng.
 */
@Entity('object_locking_configs')
@Index(['objectType'], { unique: true })
export class ObjectLockingConfig extends BaseEntity {
  @Column({
    name: 'object_type',
    type: 'varchar',
    length: 50,
    unique: true,
    comment: 'Loại object áp dụng locking (incident, change, problem...)',
  })
  objectType: ObjectType;

  @Column({
    name: 'locking_mode',
    type: 'varchar',
    length: 20,
    default: LockingMode.PESSIMISTIC,
    comment: 'Chế độ locking: none | optimistic | pessimistic | both',
  })
  lockingMode: LockingMode;

  @Column({
    name: 'is_enabled',
    type: 'boolean',
    default: true,
    comment: 'Bật/tắt locking cho object type này',
  })
  isEnabled: boolean;

  @Column({
    name: 'lock_timeout_mins',
    type: 'integer',
    default: 30,
    comment: 'Thời gian lock tự động hết hạn (phút). Áp dụng cho pessimistic mode.',
  })
  lockTimeoutMins: number;

  @Column({
    name: 'conditions',
    type: 'jsonb',
    nullable: true,
    comment: 'Điều kiện để quyết định bản ghi có cần lock không. Null = luôn lock.',
  })
  conditions?: LockConditions;

  @Column({
    name: 'apply_to_roles',
    type: 'varchar',
    array: true,
    nullable: true,
    comment: 'Danh sách role bị áp dụng locking. Null = tất cả roles.',
  })
  applyToRoles?: string[];

  @Column({
    name: 'description',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Mô tả mục đích cấu hình này',
  })
  description?: string;
}
