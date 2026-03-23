import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * SLA Entity - ITIL v4 Service Level Management
 * Định nghĩa các thỏa thuận mức dịch vụ (SLA/OLA/UC)
 */
@Entity('slas')
@Index(['name'], { unique: true })
@Index(['isActive'])
export class Sla extends BaseEntity {
  @Column({ name: 'name', unique: true, comment: 'Tên SLA' })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({
    name: 'type',
    comment: 'Loại thỏa thuận: SLA (với khách hàng), OLA (nội bộ), UC (với nhà cung cấp)',
    default: 'sla',
  })
  type: string; // sla | ola | uc

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'applies_to_ticket_type', comment: 'Loại ticket áp dụng (incident/request/all)' })
  appliesToTicketType: string;

  @Column({
    name: 'customer_group_id',
    type: 'uuid',
    nullable: true,
    comment: 'Nhóm khách hàng áp dụng',
  })
  customerGroupId?: string;

  @Column({ name: 'service_id', type: 'uuid', nullable: true, comment: 'Dịch vụ áp dụng' })
  serviceId?: string;

  // Response & Resolution targets by priority
  @Column({
    name: 'targets',
    type: 'jsonb',
    comment: 'Mục tiêu SLA theo ưu tiên (phút)',
    default: {
      critical: { responseTime: 15, resolutionTime: 240 },
      high: { responseTime: 30, resolutionTime: 480 },
      medium: { responseTime: 120, resolutionTime: 1440 },
      low: { responseTime: 480, resolutionTime: 4320 },
      planning: { responseTime: 1440, resolutionTime: 10080 },
    },
  })
  targets: Record<string, { responseTime: number; resolutionTime: number }>;

  // Business Hours
  @Column({ name: 'business_hours_only', default: true, comment: 'Tính SLA trong giờ làm việc?' })
  businessHoursOnly: boolean;

  @Column({ name: 'business_hours_start', default: '08:00', comment: 'Giờ bắt đầu làm việc' })
  businessHoursStart: string;

  @Column({ name: 'business_hours_end', default: '17:30', comment: 'Giờ kết thúc làm việc' })
  businessHoursEnd: string;

  @Column({
    name: 'working_days',
    type: 'int',
    array: true,
    default: [1, 2, 3, 4, 5],
    comment: '1=Mon, 7=Sun',
  })
  workingDays: number[];

  @Column({ name: 'timezone', default: 'Asia/Ho_Chi_Minh' })
  timezone: string;

  // Warning thresholds
  @Column({
    name: 'warning_threshold_percent',
    type: 'smallint',
    default: 75,
    comment: 'Cảnh báo khi % thời gian SLA đã trôi qua',
  })
  warningThresholdPercent: number;

  // Escalation
  @Column({
    name: 'escalation_rules',
    type: 'jsonb',
    default: [],
    comment: 'Quy tắc leo thang khi SLA sắp vi phạm',
  })
  escalationRules: Array<{
    atPercent: number;
    action: string;
    notifyRoleId?: string;
    escalateToUserId?: string;
  }>;

  // Validity
  @Column({ name: 'effective_from', type: 'date', nullable: true })
  effectiveFrom?: Date;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo?: Date;

  @Column({ name: 'review_date', type: 'date', nullable: true, comment: 'Ngày xem xét SLA' })
  reviewDate?: Date;

  @Column({ name: 'owner_id', type: 'uuid', nullable: true, comment: 'SLA Owner' })
  ownerId?: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
