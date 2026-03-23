import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ChangeStatus, ChangeType, Priority, Impact } from '../../../common/enums';

/**
 * Change Entity - ITIL v4 Change Enablement
 * Mục tiêu: Kiểm soát vòng đời của tất cả các thay đổi, cân bằng rủi ro và lợi ích
 *
 * Change Types:
 * - Standard: Pre-approved, low risk, repeatable
 * - Normal: Full CAB review required
 * - Emergency: Urgent fix, emergency CAB
 */
@Entity('changes')
@Index(['changeNumber'], { unique: true })
@Index(['status'])
@Index(['type'])
@Index(['scheduledStartDate'])
export class Change extends BaseEntity {
  @Column({ name: 'change_number', unique: true })
  changeNumber: string;

  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'description', type: 'text', comment: 'Mô tả chi tiết thay đổi' })
  description: string;

  @Column({
    name: 'justification',
    type: 'text',
    comment: 'Lý do cần thay đổi (Business Justification)',
  })
  justification: string;

  @Column({ name: 'status', type: 'enum', enum: ChangeStatus, default: ChangeStatus.DRAFT })
  status: ChangeStatus;

  @Column({
    name: 'type',
    type: 'enum',
    enum: ChangeType,
    default: ChangeType.NORMAL,
    comment: 'Loại thay đổi: Standard/Normal/Emergency',
  })
  type: ChangeType;

  @Column({ name: 'priority', type: 'enum', enum: Priority, default: Priority.MEDIUM })
  priority: Priority;

  @Column({ name: 'impact', type: 'enum', enum: Impact, default: Impact.INDIVIDUAL })
  impact: Impact;

  @Column({
    name: 'category',
    nullable: true,
    comment: 'Danh mục (Software/Hardware/Network/Process)',
  })
  category?: string;

  @Column({ name: 'service', nullable: true, comment: 'Dịch vụ bị ảnh hưởng' })
  service?: string;

  // Requestor & Owner
  @Column({ name: 'requestor_id', type: 'uuid', comment: 'Người yêu cầu thay đổi' })
  requestorId: string;

  @Column({
    name: 'change_manager_id',
    type: 'uuid',
    nullable: true,
    comment: 'Change Manager phụ trách',
  })
  changeManagerId?: string;

  @Column({
    name: 'implementer_id',
    type: 'uuid',
    nullable: true,
    comment: 'Người thực hiện thay đổi',
  })
  implementerId?: string;

  @Column({ name: 'implementer_group_id', type: 'uuid', nullable: true })
  implementerGroupId?: string;

  // Risk Assessment
  @Column({
    name: 'risk_level',
    nullable: true,
    comment: 'Mức độ rủi ro (low/medium/high/critical)',
  })
  riskLevel?: string;

  @Column({ name: 'risk_assessment', type: 'text', nullable: true, comment: 'Đánh giá rủi ro' })
  riskAssessment?: string;

  @Column({
    name: 'rollback_plan',
    type: 'text',
    nullable: true,
    comment: 'Kế hoạch rollback nếu thất bại',
  })
  rollbackPlan?: string;

  @Column({ name: 'test_plan', type: 'text', nullable: true, comment: 'Kế hoạch kiểm thử' })
  testPlan?: string;

  @Column({
    name: 'implementation_plan',
    type: 'text',
    nullable: true,
    comment: 'Kế hoạch triển khai',
  })
  implementationPlan?: string;

  // Schedule (Change Window)
  @Column({
    name: 'scheduled_start_date',
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Thời gian bắt đầu dự kiến',
  })
  scheduledStartDate?: Date;

  @Column({
    name: 'scheduled_end_date',
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Thời gian kết thúc dự kiến',
  })
  scheduledEndDate?: Date;

  @Column({ name: 'actual_start_date', type: 'timestamp with time zone', nullable: true })
  actualStartDate?: Date;

  @Column({ name: 'actual_end_date', type: 'timestamp with time zone', nullable: true })
  actualEndDate?: Date;

  // CAB (Change Advisory Board)
  @Column({ name: 'cab_required', default: false, comment: 'Cần họp CAB?' })
  cabRequired: boolean;

  @Column({ name: 'cab_meeting_date', type: 'timestamp with time zone', nullable: true })
  cabMeetingDate?: Date;

  @Column({ name: 'cab_notes', type: 'text', nullable: true })
  cabNotes?: string;

  // Approvals
  @Column({ name: 'approvals', type: 'jsonb', default: [], comment: 'Danh sách phê duyệt' })
  approvals: Array<{
    approverId: string;
    approverName: string;
    status: 'pending' | 'approved' | 'rejected';
    comment?: string;
    actionAt?: Date;
    required: boolean;
  }>;

  // Implementation
  @Column({
    name: 'implementation_notes',
    type: 'text',
    nullable: true,
    comment: 'Ghi chú thực hiện',
  })
  implementationNotes?: string;

  @Column({
    name: 'post_implementation_review',
    type: 'text',
    nullable: true,
    comment: 'Đánh giá sau triển khai',
  })
  postImplementationReview?: string;

  @Column({ name: 'failure_reason', type: 'text', nullable: true, comment: 'Lý do thất bại' })
  failureReason?: string;

  // Closure
  @Column({
    name: 'closure_code',
    nullable: true,
    comment: 'Mã đóng (successful/unsuccessful/cancelled)',
  })
  closureCode?: string;

  @Column({ name: 'closed_at', type: 'timestamp with time zone', nullable: true })
  closedAt?: Date;

  @Column({ name: 'closed_by', type: 'uuid', nullable: true })
  closedBy?: string;

  // Relations
  @Column({ name: 'related_incident_ids', type: 'uuid', array: true, default: [] })
  relatedIncidentIds: string[];

  @Column({ name: 'related_problem_id', type: 'uuid', nullable: true })
  relatedProblemId?: string;

  @Column({
    name: 'release_id',
    type: 'uuid',
    nullable: true,
    comment: 'Release bao gồm Change này',
  })
  releaseId?: string;

  @Column({ name: 'affected_ci_ids', type: 'uuid', array: true, default: [] })
  affectedCiIds: string[];

  @Column({ name: 'attachments', type: 'jsonb', default: [] })
  attachments: Array<{ name: string; url: string; size: number; type: string }>;

  @Column({ name: 'tags', type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  get isApproved(): boolean {
    if (this.approvals.length === 0) return false;
    return this.approvals.filter(a => a.required).every(a => a.status === 'approved');
  }

  get isRejected(): boolean {
    return this.approvals.some(a => a.required && a.status === 'rejected');
  }
}
