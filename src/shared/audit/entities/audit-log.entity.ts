import { Entity, Column, Index, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

/**
 * Audit Log Entity - Full audit trail for ITIL compliance
 * Ghi lại tất cả thao tác trong hệ thống để đáp ứng yêu cầu compliance
 */
@Entity('audit_logs')
@Index(['userId'])
@Index(['resource'])
@Index(['action'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'action', comment: 'Hành động: CREATE/UPDATE/DELETE/LOGIN...' })
  action: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string;

  @Column({ name: 'username', nullable: true })
  username?: string;

  @Column({ name: 'resource', nullable: true, comment: 'Loại tài nguyên (incidents, changes...)' })
  resource?: string;

  @Column({ name: 'resource_id', nullable: true })
  resourceId?: string;

  @Column({ name: 'payload', type: 'jsonb', nullable: true, comment: 'Dữ liệu gửi lên' })
  payload?: any;

  @Column({ name: 'changes', type: 'jsonb', nullable: true, comment: 'Thay đổi (before/after)' })
  changes?: { before?: any; after?: any };

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  @Column({ name: 'request_id', nullable: true })
  requestId?: string;

  @Column({ name: 'status', default: 'success', comment: 'success/failed' })
  status: string;

  @Column({ name: 'error_message', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}
