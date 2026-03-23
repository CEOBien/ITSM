import { Entity, Column, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserRole, UserStatus } from '../../../common/enums';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
@Index(['employeeId'], { unique: true, sparse: true })
export class User extends BaseEntity {
  @Column({ name: 'employee_id', nullable: true, comment: 'Mã nhân viên' })
  employeeId?: string;

  @Column({ name: 'username', unique: true, comment: 'Tên đăng nhập' })
  username: string;

  @Column({ name: 'email', unique: true, comment: 'Email' })
  email: string;

  @Column({ name: 'full_name', comment: 'Họ và tên' })
  fullName: string;

  @Column({ name: 'first_name', nullable: true })
  firstName?: string;

  @Column({ name: 'last_name', nullable: true })
  lastName?: string;

  @Column({ name: 'password', select: false, comment: 'Mật khẩu đã hash' })
  @Exclude()
  password: string;

  @Column({
    name: 'role',
    type: 'enum',
    enum: UserRole,
    default: UserRole.END_USER,
    comment: 'Vai trò trong hệ thống ITSM',
  })
  role: UserRole;

  @Column({
    name: 'status',
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ name: 'phone', nullable: true })
  phone?: string;

  @Column({ name: 'mobile', nullable: true })
  mobile?: string;

  @Column({ name: 'avatar', nullable: true })
  avatar?: string;

  @Column({ name: 'title', nullable: true, comment: 'Chức danh' })
  title?: string;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId?: string;

  @Column({ name: 'location', nullable: true, comment: 'Địa điểm làm việc' })
  location?: string;

  @Column({ name: 'timezone', default: 'Asia/Ho_Chi_Minh' })
  timezone: string;

  @Column({ name: 'language', default: 'vi' })
  language: string;

  @Column({ name: 'is_vip', default: false, comment: 'Người dùng VIP - ưu tiên cao hơn' })
  isVip: boolean;

  @Column({ name: 'last_login_at', type: 'timestamp with time zone', nullable: true })
  lastLoginAt?: Date;

  @Column({ name: 'failed_login_attempts', default: 0 })
  @Exclude()
  failedLoginAttempts: number;

  @Column({ name: 'password_changed_at', type: 'timestamp with time zone', nullable: true })
  passwordChangedAt?: Date;

  @Column({ name: 'password_reset_token', nullable: true, select: false })
  @Exclude()
  passwordResetToken?: string;

  @Column({
    name: 'password_reset_expiry',
    type: 'timestamp with time zone',
    nullable: true,
    select: false,
  })
  @Exclude()
  passwordResetExpiry?: Date;

  @Column({ name: 'notification_email', default: true })
  notificationEmail: boolean;

  @Column({ name: 'notification_sms', default: false })
  notificationSms: boolean;

  @Column({ name: 'notification_push', default: true })
  notificationPush: boolean;

  @Column({ name: 'manager_id', type: 'uuid', nullable: true, comment: 'ID quản lý trực tiếp' })
  managerId?: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true, comment: 'Thông tin bổ sung' })
  metadata?: Record<string, any>;

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  isLocked(): boolean {
    return this.status === UserStatus.LOCKED;
  }

  hasRole(...roles: UserRole[]): boolean {
    return roles.includes(this.role);
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN || this.role === UserRole.SUPER_ADMIN;
  }

  getDisplayName(): string {
    return this.fullName || this.username;
  }
}
