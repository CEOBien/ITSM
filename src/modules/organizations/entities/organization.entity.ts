import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum OrgType {
  KHOI = 'khoi',
  CHI_NHANH = 'chi_nhanh',
  TRUNG_TAM = 'trung_tam',
  PHONG = 'phong',
}

export enum OrgLevel {
  L1 = 1,
  L2 = 2,
  L3 = 3,
}

@Entity('organizations')
@Index(['code'], { unique: true })
@Check(`"level" IN (1, 2, 3)`)
export class Organization extends BaseEntity {
  @Column({ name: 'code', unique: true, comment: 'Mã đơn vị tổ chức' })
  code: string;

  @Column({ name: 'name', comment: 'Tên đơn vị tổ chức' })
  name: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: OrgType,
    comment: 'Loại đơn vị: khoi | chi_nhanh | trung_tam | phong',
  })
  type: OrgType;

  @Column({
    name: 'level',
    type: 'int',
    comment: 'Cấp tổ chức: 1=Khối/CN, 2=TT/Phòng(KH/CN), 3=Phòng(TT)',
  })
  level: OrgLevel;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId?: string;

  @ManyToOne(() => Organization, (org) => org.children, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' })
  parent?: Organization;

  @OneToMany(() => Organization, (org) => org.parent)
  children: Organization[];

  @Column({ name: 'description', type: 'text', nullable: true, comment: 'Mô tả đơn vị' })
  description?: string;

  @Column({ name: 'phone', nullable: true, comment: 'Số điện thoại' })
  phone?: string;

  @Column({ name: 'address', nullable: true, comment: 'Địa chỉ' })
  address?: string;

  @Column({ name: 'is_active', default: true, comment: 'Trạng thái hoạt động' })
  isActive: boolean;

  @Column({ name: 'sort_order', default: 0, comment: 'Thứ tự hiển thị' })
  sortOrder: number;

  static computeLevel(type: OrgType, parentType?: OrgType): OrgLevel {
    if (type === OrgType.KHOI || type === OrgType.CHI_NHANH) return OrgLevel.L1;
    if (type === OrgType.TRUNG_TAM) return OrgLevel.L2;
    if (type === OrgType.PHONG) {
      if (parentType === OrgType.TRUNG_TAM) return OrgLevel.L3;
      return OrgLevel.L2;
    }
    return OrgLevel.L2;
  }
}
