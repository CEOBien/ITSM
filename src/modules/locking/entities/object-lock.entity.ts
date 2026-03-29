import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn } from 'typeorm';
import { ObjectType } from '../enums/locking.enum';

/**
 * Active locks — bảng operational, không extend BaseEntity vì:
 * - Không cần soft delete (lock được hard-delete khi release)
 * - Không cần version (không có concurrent edits của chính lock)
 * - Không cần createdBy/updatedBy (đã có lockedBy)
 */
@Entity('object_locks')
@Index(['objectType', 'objectId'], { unique: true })
@Index(['lockedBy'])
@Index(['expiresAt'])
export class ObjectLock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'object_type',
    type: 'varchar',
    length: 50,
    comment: 'Loại object đang bị lock',
  })
  objectType: ObjectType;

  @Column({
    name: 'object_id',
    type: 'uuid',
    comment: 'ID của bản ghi đang bị lock',
  })
  objectId: string;

  @Column({
    name: 'locked_by',
    type: 'uuid',
    comment: 'ID user đang giữ lock',
  })
  lockedBy: string;

  @Column({
    name: 'locked_by_name',
    type: 'varchar',
    length: 255,
    comment: 'Tên đầy đủ của user giữ lock (để hiển thị cho user khác)',
  })
  lockedByName: string;

  @CreateDateColumn({
    name: 'locked_at',
    type: 'timestamp with time zone',
    comment: 'Thời điểm lock được tạo',
  })
  lockedAt: Date;

  @Column({
    name: 'expires_at',
    type: 'timestamp with time zone',
    comment: 'Thời điểm lock tự động hết hạn',
  })
  expiresAt: Date;

  @Column({
    name: 'session_id',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Browser session ID — để phân biệt nhiều tab của cùng một user',
  })
  sessionId?: string;
}
