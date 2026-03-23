import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { RequestStatus, Priority } from '../../../common/enums';

/**
 * Service Request Entity - ITIL v4 Service Request Management
 * Xử lý các yêu cầu dịch vụ thông thường, đã được chuẩn hóa và pre-approved
 */
@Entity('service_requests')
@Index(['requestNumber'], { unique: true })
@Index(['status'])
@Index(['requesterId'])
export class ServiceRequest extends BaseEntity {
  @Column({ name: 'request_number', unique: true })
  requestNumber: string;

  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'description', type: 'text' })
  description: string;

  @Column({ name: 'status', type: 'enum', enum: RequestStatus, default: RequestStatus.NEW })
  status: RequestStatus;

  @Column({ name: 'priority', type: 'enum', enum: Priority, default: Priority.LOW })
  priority: Priority;

  @Column({
    name: 'catalog_item_id',
    type: 'uuid',
    nullable: true,
    comment: 'Catalog item yêu cầu',
  })
  catalogItemId?: string;

  @Column({ name: 'catalog_item_name', nullable: true })
  catalogItemName?: string;

  @Column({ name: 'category', nullable: true })
  category?: string;

  @Column({ name: 'requester_id', type: 'uuid', comment: 'Người yêu cầu' })
  requesterId: string;

  @Column({ name: 'requester_name', nullable: true })
  requesterName?: string;

  @Column({ name: 'requester_email', nullable: true })
  requesterEmail?: string;

  @Column({
    name: 'on_behalf_of_id',
    type: 'uuid',
    nullable: true,
    comment: 'Yêu cầu thay cho người khác',
  })
  onBehalfOfId?: string;

  @Column({ name: 'assignee_id', type: 'uuid', nullable: true })
  assigneeId?: string;

  @Column({ name: 'assignee_group_id', type: 'uuid', nullable: true })
  assigneeGroupId?: string;

  // Approval workflow
  @Column({ name: 'requires_approval', default: false })
  requiresApproval: boolean;

  @Column({ name: 'approvals', type: 'jsonb', default: [] })
  approvals: Array<{
    approverId: string;
    approverName: string;
    status: 'pending' | 'approved' | 'rejected';
    comment?: string;
    actionAt?: Date;
  }>;

  @Column({ name: 'approval_reason', type: 'text', nullable: true })
  approvalReason?: string;

  // SLA
  @Column({ name: 'resolution_deadline', type: 'timestamp with time zone', nullable: true })
  resolutionDeadline?: Date;

  // Form data (flexible for different catalog items)
  @Column({
    name: 'form_data',
    type: 'jsonb',
    nullable: true,
    comment: 'Dữ liệu form từ catalog item',
  })
  formData?: Record<string, any>;

  // Fulfillment
  @Column({ name: 'fulfillment_notes', type: 'text', nullable: true })
  fulfillmentNotes?: string;

  @Column({ name: 'fulfilled_at', type: 'timestamp with time zone', nullable: true })
  fulfilledAt?: Date;

  @Column({ name: 'fulfilled_by', type: 'uuid', nullable: true })
  fulfilledBy?: string;

  @Column({ name: 'closed_at', type: 'timestamp with time zone', nullable: true })
  closedAt?: Date;

  @Column({ name: 'cancelled_reason', type: 'text', nullable: true })
  cancelledReason?: string;

  // Feedback
  @Column({ name: 'customer_satisfaction', type: 'smallint', nullable: true })
  customerSatisfaction?: number;

  @Column({ name: 'customer_feedback', type: 'text', nullable: true })
  customerFeedback?: string;

  @Column({ name: 'source', default: 'portal' })
  source: string;

  @Column({ name: 'attachments', type: 'jsonb', default: [] })
  attachments: Array<{ name: string; url: string; size: number; type: string }>;

  @Column({ name: 'tags', type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
