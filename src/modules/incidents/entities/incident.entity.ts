import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { IncidentStatus, Priority, Impact, Urgency, SlaStatus } from '../../../common/enums';

/**
 * Incident Entity - ITIL v4 Incident Management
 * Mục tiêu: Khôi phục dịch vụ nhanh nhất có thể, giảm thiểu tác động đến doanh nghiệp
 */
@Entity('incidents')
@Index(['incidentNumber'], { unique: true })
@Index(['status'])
@Index(['priority'])
@Index(['assigneeId'])
@Index(['reporterId'])
@Index(['createdAt'])
export class Incident extends BaseEntity {
  @Column({
    name: 'incident_number',
    unique: true,
    comment: 'Số hiệu sự cố (VD: INC-20240321-000001)',
  })
  incidentNumber: string;

  @Column({ name: 'title', comment: 'Tiêu đề ngắn mô tả sự cố' })
  title: string;

  @Column({ name: 'description', type: 'text', comment: 'Mô tả chi tiết sự cố' })
  description: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.NEW,
    comment: 'Trạng thái xử lý sự cố',
  })
  status: IncidentStatus;

  @Column({
    name: 'priority',
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
    comment: 'Mức độ ưu tiên (tính từ Impact x Urgency)',
  })
  priority: Priority;

  @Column({
    name: 'impact',
    type: 'enum',
    enum: Impact,
    default: Impact.INDIVIDUAL,
    comment: 'Mức độ ảnh hưởng',
  })
  impact: Impact;

  @Column({
    name: 'urgency',
    type: 'enum',
    enum: Urgency,
    default: Urgency.MEDIUM,
    comment: 'Mức độ khẩn cấp',
  })
  urgency: Urgency;

  @Column({ name: 'category', nullable: true, comment: 'Danh mục sự cố' })
  category?: string;

  @Column({ name: 'subcategory', nullable: true, comment: 'Danh mục con' })
  subcategory?: string;

  @Column({ name: 'service', nullable: true, comment: 'Dịch vụ bị ảnh hưởng' })
  service?: string;

  @Column({ name: 'reporter_id', type: 'uuid', comment: 'Người báo cáo sự cố' })
  reporterId: string;

  @Column({ name: 'reporter_name', nullable: true })
  reporterName?: string;

  @Column({ name: 'reporter_email', nullable: true })
  reporterEmail?: string;

  @Column({ name: 'assignee_id', type: 'uuid', nullable: true, comment: 'Người được giao xử lý' })
  assigneeId?: string;

  @Column({
    name: 'assignee_group_id',
    type: 'uuid',
    nullable: true,
    comment: 'FK → assignment_groups (nhóm giao việc / queue)',
  })
  assigneeGroupId?: string;

  @Column({ name: 'escalation_level', default: 1, comment: 'Cấp độ leo thang (L1/L2/L3/L4)' })
  escalationLevel: number;

  @Column({ name: 'escalated_at', type: 'timestamp with time zone', nullable: true })
  escalatedAt?: Date;

  @Column({ name: 'escalated_to', type: 'uuid', nullable: true })
  escalatedTo?: string;

  // SLA Fields
  @Column({ name: 'sla_id', type: 'uuid', nullable: true })
  slaId?: string;

  @Column({
    name: 'response_deadline',
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Hạn phản hồi lần đầu',
  })
  responseDeadline?: Date;

  @Column({
    name: 'resolution_deadline',
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Hạn giải quyết',
  })
  resolutionDeadline?: Date;

  @Column({
    name: 'first_response_at',
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Thời điểm phản hồi lần đầu',
  })
  firstResponseAt?: Date;

  @Column({
    name: 'sla_status',
    type: 'enum',
    enum: SlaStatus,
    default: SlaStatus.ACTIVE,
  })
  slaStatus: SlaStatus;

  @Column({ name: 'sla_paused_at', type: 'timestamp with time zone', nullable: true })
  slaPausedAt?: Date;

  @Column({
    name: 'sla_paused_duration',
    default: 0,
    comment: 'Tổng thời gian tạm dừng SLA (phút)',
  })
  slaPausedDuration: number;

  // Resolution
  @Column({ name: 'resolution', type: 'text', nullable: true, comment: 'Giải pháp xử lý' })
  resolution?: string;

  @Column({ name: 'root_cause', type: 'text', nullable: true, comment: 'Nguyên nhân gốc rễ' })
  rootCause?: string;

  @Column({ name: 'workaround', type: 'text', nullable: true, comment: 'Giải pháp tạm thời' })
  workaround?: string;

  @Column({ name: 'resolved_at', type: 'timestamp with time zone', nullable: true })
  resolvedAt?: Date;

  @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
  resolvedBy?: string;

  @Column({ name: 'closed_at', type: 'timestamp with time zone', nullable: true })
  closedAt?: Date;

  @Column({ name: 'closed_by', type: 'uuid', nullable: true })
  closedBy?: string;

  @Column({
    name: 'closure_code',
    nullable: true,
    comment: 'Mã đóng sự cố (resolved, user_error, no_fault, etc.)',
  })
  closureCode?: string;

  // Relations
  @Column({
    name: 'problem_id',
    type: 'uuid',
    nullable: true,
    comment: 'Liên kết Problem liên quan',
  })
  problemId?: string;

  @Column({
    name: 'change_id',
    type: 'uuid',
    nullable: true,
    comment: 'Liên kết Change gây ra sự cố',
  })
  changeId?: string;

  @Column({
    name: 'knowledge_article_id',
    type: 'uuid',
    nullable: true,
    comment: 'Bài viết KB được áp dụng',
  })
  knowledgeArticleId?: string;

  @Column({
    name: 'affected_ci_ids',
    type: 'uuid',
    array: true,
    default: [],
    comment: 'Danh sách CI bị ảnh hưởng',
  })
  affectedCiIds: string[];

  // Additional info
  @Column({
    name: 'customer_satisfaction',
    type: 'smallint',
    nullable: true,
    comment: 'Đánh giá của người dùng (1-5)',
  })
  customerSatisfaction?: number;

  @Column({ name: 'customer_feedback', type: 'text', nullable: true })
  customerFeedback?: string;

  @Column({ name: 'tags', type: 'text', array: true, default: [] })
  tags: string[];

  @Column({
    name: 'source',
    default: 'portal',
    comment: 'Nguồn tiếp nhận (portal/email/phone/auto)',
  })
  source: string;

  @Column({
    name: 'is_major_incident',
    default: false,
    comment: 'Sự cố nghiêm trọng - cần quy trình đặc biệt',
  })
  isMajorIncident: boolean;

  @Column({ name: 'pending_reason', nullable: true, comment: 'Lý do tạm dừng' })
  pendingReason?: string;

  @Column({ name: 'on_hold_reason', nullable: true })
  onHoldReason?: string;

  @Column({ name: 'attachments', type: 'jsonb', default: [], comment: 'Danh sách file đính kèm' })
  attachments: Array<{ name: string; url: string; size: number; type: string }>;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Computed property
  get isBreachingSla(): boolean {
    if (!this.resolutionDeadline) return false;
    return (
      new Date() > this.resolutionDeadline &&
      this.status !== IncidentStatus.RESOLVED &&
      this.status !== IncidentStatus.CLOSED
    );
  }

  get isOpen(): boolean {
    return ![IncidentStatus.RESOLVED, IncidentStatus.CLOSED, IncidentStatus.CANCELLED].includes(
      this.status,
    );
  }
}
