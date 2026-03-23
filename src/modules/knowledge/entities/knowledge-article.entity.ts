import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { KnowledgeStatus } from '../../../common/enums';

/**
 * Knowledge Article Entity - ITIL v4 Knowledge Management
 * Quản lý tri thức: hướng dẫn, FAQ, workaround, known errors, best practices
 */
@Entity('knowledge_articles')
@Index(['articleNumber'], { unique: true })
@Index(['status'])
@Index(['category'])
export class KnowledgeArticle extends BaseEntity {
  @Column({ name: 'article_number', unique: true })
  articleNumber: string;

  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'summary', nullable: true, comment: 'Tóm tắt nội dung' })
  summary?: string;

  @Column({ name: 'content', type: 'text', comment: 'Nội dung chi tiết (Markdown/HTML)' })
  content: string;

  @Column({ name: 'status', type: 'enum', enum: KnowledgeStatus, default: KnowledgeStatus.DRAFT })
  status: KnowledgeStatus;

  @Column({
    name: 'type',
    default: 'how_to',
    comment: 'Loại bài viết: how_to/faq/known_error/workaround/policy/best_practice',
  })
  type: string;

  @Column({ name: 'category', nullable: true, comment: 'Danh mục kiến thức' })
  category?: string;

  @Column({ name: 'subcategory', nullable: true })
  subcategory?: string;

  @Column({ name: 'service', nullable: true, comment: 'Dịch vụ liên quan' })
  service?: string;

  // Authoring
  @Column({ name: 'author_id', type: 'uuid', comment: 'Tác giả' })
  authorId: string;

  @Column({ name: 'author_name', nullable: true })
  authorName?: string;

  @Column({ name: 'reviewer_id', type: 'uuid', nullable: true, comment: 'Người review' })
  reviewerId?: string;

  @Column({ name: 'reviewed_at', type: 'timestamp with time zone', nullable: true })
  reviewedAt?: Date;

  @Column({ name: 'published_at', type: 'timestamp with time zone', nullable: true })
  publishedAt?: Date;

  @Column({ name: 'published_by', type: 'uuid', nullable: true })
  publishedBy?: string;

  @Column({ name: 'archived_at', type: 'timestamp with time zone', nullable: true })
  archivedAt?: Date;

  // Expiry & Review
  @Column({ name: 'expiry_date', type: 'date', nullable: true, comment: 'Ngày hết hạn' })
  expiryDate?: Date;

  @Column({ name: 'review_date', type: 'date', nullable: true, comment: 'Ngày cần review lại' })
  reviewDate?: Date;

  // Access Control
  @Column({ name: 'visibility', default: 'all', comment: 'Hiển thị: all/agent/internal' })
  visibility: string;

  @Column({ name: 'is_featured', default: false, comment: 'Bài viết nổi bật' })
  isFeatured: boolean;

  // Analytics
  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ name: 'helpful_count', default: 0 })
  helpfulCount: number;

  @Column({ name: 'not_helpful_count', default: 0 })
  notHelpfulCount: number;

  @Column({ name: 'use_count', default: 0, comment: 'Số lần được dùng để giải quyết ticket' })
  useCount: number;

  @Column({ name: 'rating', type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating?: number;

  // Related
  @Column({ name: 'related_article_ids', type: 'uuid', array: true, default: [] })
  relatedArticleIds: string[];

  @Column({ name: 'related_incident_ids', type: 'uuid', array: true, default: [] })
  relatedIncidentIds: string[];

  @Column({ name: 'tags', type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ name: 'keywords', type: 'text', array: true, default: [], comment: 'Từ khóa tìm kiếm' })
  keywords: string[];

  @Column({ name: 'attachments', type: 'jsonb', default: [] })
  attachments: Array<{ name: string; url: string; size: number; type: string }>;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  get helpfulRatio(): number {
    const total = this.helpfulCount + this.notHelpfulCount;
    if (total === 0) return 0;
    return Math.round((this.helpfulCount / total) * 100);
  }
}
