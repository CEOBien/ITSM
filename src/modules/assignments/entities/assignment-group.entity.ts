import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AssignmentPractice } from '../../../common/enums';
import { Organization } from '../../organizations/entities/organization.entity';

/**
 * Nhóm giao việc (assignment group) — master data cho assigneeGroupId trên incident / ticket khác.
 * Tách khỏi bảng organizations để mô hình queue L1/L2 rõ ràng.
 */
@Entity('assignment_groups')
@Index(['code'], { unique: true })
@Index(['practice', 'isActive'])
export class AssignmentGroup extends BaseEntity {
  @Column({ name: 'code', unique: true, comment: 'Mã nhóm (VD: INC-L1-SD)' })
  code: string;

  @Column({ name: 'name', comment: 'Tên hiển thị' })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  /** Liên kết nới lỏng với đơn vị tổ chức (báo cáo / org chart) */
  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId?: string;

  @ManyToOne(() => Organization, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Column({
    name: 'practice',
    type: 'varchar',
    length: 32,
    default: AssignmentPractice.INCIDENTS,
    comment: 'Practice ITIL: incidents | problems | changes | service_requests',
  })
  practice: AssignmentPractice;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;
}
