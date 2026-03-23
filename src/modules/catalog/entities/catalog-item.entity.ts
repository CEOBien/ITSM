import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Catalog Item Entity - ITIL v4 Service Catalogue Management
 * Danh mục dịch vụ IT - những gì IT cung cấp cho người dùng
 */
@Entity('catalog_items')
@Index(['code'], { unique: true })
@Index(['isActive'])
@Index(['category'])
export class CatalogItem extends BaseEntity {
  @Column({ name: 'code', unique: true, comment: 'Mã dịch vụ' })
  code: string;

  @Column({ name: 'name', comment: 'Tên dịch vụ' })
  name: string;

  @Column({
    name: 'short_description',
    nullable: true,
    comment: 'Mô tả ngắn hiển thị trong danh mục',
  })
  shortDescription?: string;

  @Column({ name: 'description', type: 'text', nullable: true, comment: 'Mô tả chi tiết dịch vụ' })
  description?: string;

  @Column({ name: 'category', comment: 'Danh mục dịch vụ' })
  category: string;

  @Column({ name: 'subcategory', nullable: true })
  subcategory?: string;

  @Column({ name: 'icon', nullable: true, comment: 'Icon URL' })
  icon?: string;

  @Column({ name: 'image', nullable: true })
  image?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({
    name: 'is_visible_to_users',
    default: true,
    comment: 'Hiện trong self-service portal?',
  })
  isVisibleToUsers: boolean;

  @Column({ name: 'requires_approval', default: false, comment: 'Cần phê duyệt?' })
  requiresApproval: boolean;

  @Column({ name: 'approval_group_id', type: 'uuid', nullable: true })
  approvalGroupId?: string;

  @Column({ name: 'fulfillment_group_id', type: 'uuid', nullable: true, comment: 'Nhóm thực hiện' })
  fulfillmentGroupId?: string;

  // SLA
  @Column({
    name: 'sla_response_minutes',
    type: 'integer',
    default: 480,
    comment: 'Thời gian phản hồi (phút)',
  })
  slaResponseMinutes: number;

  @Column({
    name: 'sla_resolution_minutes',
    type: 'integer',
    default: 1440,
    comment: 'Thời gian giải quyết (phút)',
  })
  slaResolutionMinutes: number;

  // Form Definition
  @Column({
    name: 'form_fields',
    type: 'jsonb',
    default: [],
    comment: 'Định nghĩa các trường form yêu cầu',
  })
  formFields: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'multiselect' | 'date' | 'number' | 'boolean' | 'file';
    required: boolean;
    options?: string[];
    defaultValue?: any;
    placeholder?: string;
    helpText?: string;
  }>;

  // Workflow
  @Column({
    name: 'workflow_template',
    type: 'jsonb',
    nullable: true,
    comment: 'Mẫu workflow xử lý',
  })
  workflowTemplate?: Record<string, any>;

  // Pricing
  @Column({
    name: 'cost',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    comment: 'Chi phí (nếu có)',
  })
  cost?: number;

  @Column({ name: 'currency', default: 'VND' })
  currency: string;

  // Knowledge
  @Column({ name: 'knowledge_article_ids', type: 'uuid', array: true, default: [] })
  knowledgeArticleIds: string[];

  // Analytics
  @Column({ name: 'request_count', default: 0 })
  requestCount: number;

  @Column({ name: 'average_satisfaction', type: 'decimal', precision: 3, scale: 2, nullable: true })
  averageSatisfaction?: number;

  // Sort & Display
  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'tags', type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
