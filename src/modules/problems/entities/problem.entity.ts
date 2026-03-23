import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProblemStatus, Priority, Impact } from '../../../common/enums';

/**
 * Problem Entity - ITIL v4 Problem Management
 * Mục tiêu: Xác định và loại bỏ nguyên nhân gốc rễ của các sự cố
 * Known Error Database (KEDB) integration
 */
@Entity('problems')
@Index(['problemNumber'], { unique: true })
@Index(['status'])
@Index(['priority'])
export class Problem extends BaseEntity {
  @Column({ name: 'problem_number', unique: true })
  problemNumber: string;

  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'description', type: 'text' })
  description: string;

  @Column({ name: 'status', type: 'enum', enum: ProblemStatus, default: ProblemStatus.NEW })
  status: ProblemStatus;

  @Column({ name: 'priority', type: 'enum', enum: Priority, default: Priority.MEDIUM })
  priority: Priority;

  @Column({ name: 'impact', type: 'enum', enum: Impact, default: Impact.INDIVIDUAL })
  impact: Impact;

  @Column({ name: 'category', nullable: true })
  category?: string;

  @Column({ name: 'subcategory', nullable: true })
  subcategory?: string;

  @Column({ name: 'service', nullable: true, comment: 'Dịch vụ liên quan' })
  service?: string;

  @Column({ name: 'assignee_id', type: 'uuid', nullable: true })
  assigneeId?: string;

  @Column({ name: 'problem_manager_id', type: 'uuid', nullable: true })
  problemManagerId?: string;

  // Root Cause Analysis
  @Column({
    name: 'root_cause',
    type: 'text',
    nullable: true,
    comment: 'Nguyên nhân gốc rễ đã xác định',
  })
  rootCause?: string;

  @Column({ name: 'root_cause_identified_at', type: 'timestamp with time zone', nullable: true })
  rootCauseIdentifiedAt?: Date;

  // Known Error Database (KEDB)
  @Column({
    name: 'is_known_error',
    default: false,
    comment: 'Đã đăng ký vào Known Error Database',
  })
  isKnownError: boolean;

  @Column({ name: 'known_error_registered_at', type: 'timestamp with time zone', nullable: true })
  knownErrorRegisteredAt?: Date;

  @Column({
    name: 'workaround',
    type: 'text',
    nullable: true,
    comment: 'Giải pháp tạm thời (workaround)',
  })
  workaround?: string;

  @Column({ name: 'permanent_fix', type: 'text', nullable: true, comment: 'Giải pháp vĩnh viễn' })
  permanentFix?: string;

  @Column({ name: 'error_description', type: 'text', nullable: true })
  errorDescription?: string;

  // Resolution
  @Column({ name: 'resolution', type: 'text', nullable: true })
  resolution?: string;

  @Column({ name: 'resolved_at', type: 'timestamp with time zone', nullable: true })
  resolvedAt?: Date;

  @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
  resolvedBy?: string;

  @Column({ name: 'closed_at', type: 'timestamp with time zone', nullable: true })
  closedAt?: Date;

  // Related Records
  @Column({
    name: 'related_incident_ids',
    type: 'uuid',
    array: true,
    default: [],
    comment: 'Danh sách sự cố liên quan',
  })
  relatedIncidentIds: string[];

  @Column({
    name: 'related_change_id',
    type: 'uuid',
    nullable: true,
    comment: 'Change request để fix problem',
  })
  relatedChangeId?: string;

  @Column({ name: 'affected_ci_ids', type: 'uuid', array: true, default: [] })
  affectedCiIds: string[];

  @Column({ name: 'knowledge_article_id', type: 'uuid', nullable: true })
  knowledgeArticleId?: string;

  // Investigation
  @Column({ name: 'investigation_notes', type: 'jsonb', default: [], comment: 'Nhật ký điều tra' })
  investigationNotes: Array<{ date: Date; author: string; content: string }>;

  @Column({ name: 'five_whys', type: 'jsonb', nullable: true, comment: 'Phân tích 5 Whys' })
  fiveWhys?: Array<{ question: string; answer: string }>;

  @Column({ name: 'attachments', type: 'jsonb', default: [] })
  attachments: Array<{ name: string; url: string; size: number; type: string }>;

  @Column({ name: 'tags', type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
