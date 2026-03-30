import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CiStatus } from '../../../common/enums';

/**
 * Configuration Item (CI) Entity - ITIL v4 Service Configuration Management
 * Quản lý tài sản và cấu hình IT, liên kết với các ticket và dịch vụ
 */
@Entity('configuration_items')
@Index(['ciNumber'], { unique: true })
@Index(['name', 'type'])
@Index(['status'])
@Index(['ownerId'])
export class ConfigurationItem extends BaseEntity {
  @Column({ name: 'ci_number', unique: true, comment: 'Mã CI duy nhất' })
  ciNumber: string;

  @Column({ name: 'name', comment: 'Tên CI' })
  name: string;

  @Column({ name: 'display_name', nullable: true })
  displayName?: string;

  @Column({ name: 'type', comment: 'Loại CI (server/workstation/software/service...)' })
  type: string;

  @Column({ name: 'subtype', nullable: true })
  subtype?: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: CiStatus,
    default: CiStatus.ACTIVE,
  })
  status: CiStatus;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  // Ownership
  @Column({ name: 'owner_id', type: 'uuid', nullable: true, comment: 'Người chịu trách nhiệm CI' })
  ownerId?: string;

  @Column({ name: 'owner_department_id', type: 'uuid', nullable: true })
  ownerDepartmentId?: string;

  @Column({ name: 'location', nullable: true, comment: 'Vị trí vật lý' })
  location?: string;

  @Column({ name: 'building', nullable: true })
  building?: string;

  @Column({ name: 'floor', nullable: true })
  floor?: string;

  @Column({ name: 'room', nullable: true })
  room?: string;

  // Technical Details
  @Column({ name: 'manufacturer', nullable: true, comment: 'Nhà sản xuất' })
  manufacturer?: string;

  @Column({ name: 'model', nullable: true, comment: 'Model' })
  model?: string;

  @Column({ name: 'serial_number', nullable: true, comment: 'Serial number' })
  serialNumber?: string;

  @Column({ name: 'ci_version', nullable: true, comment: 'Phiên bản phần mềm/firmware' })
  ciVersion?: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'mac_address', nullable: true })
  macAddress?: string;

  @Column({ name: 'hostname', nullable: true })
  hostname?: string;

  @Column({ name: 'operating_system', nullable: true })
  operatingSystem?: string;

  @Column({ name: 'os_version', nullable: true })
  osVersion?: string;

  @Column({ name: 'cpu', nullable: true })
  cpu?: string;

  @Column({ name: 'ram_gb', type: 'integer', nullable: true })
  ramGb?: number;

  @Column({ name: 'storage_gb', type: 'integer', nullable: true })
  storageGb?: number;

  // Lifecycle
  @Column({ name: 'purchase_date', type: 'date', nullable: true })
  purchaseDate?: Date;

  @Column({ name: 'warranty_expiry', type: 'date', nullable: true })
  warrantyExpiry?: Date;

  @Column({ name: 'end_of_life_date', type: 'date', nullable: true })
  endOfLifeDate?: Date;

  @Column({ name: 'purchase_cost', type: 'decimal', precision: 15, scale: 2, nullable: true })
  purchaseCost?: number;

  @Column({ name: 'currency', default: 'VND' })
  currency: string;

  // Contract/License
  @Column({ name: 'contract_id', nullable: true })
  contractId?: string;

  @Column({ name: 'license_key', nullable: true })
  licenseKey?: string;

  @Column({ name: 'license_type', nullable: true })
  licenseType?: string;

  @Column({ name: 'license_expiry', type: 'date', nullable: true })
  licenseExpiry?: Date;

  // CMDB Relationships
  @Column({
    name: 'relationships',
    type: 'jsonb',
    default: [],
    comment: 'Mối quan hệ với CI khác',
  })
  relationships: Array<{
    relatedCiId: string;
    relatedCiName: string;
    relationshipType: string; // depends_on, connected_to, runs_on, hosts, parent_of, etc.
    direction: 'upstream' | 'downstream';
  }>;

  // Service mapping
  @Column({
    name: 'service_ids',
    type: 'uuid',
    array: true,
    default: [],
    comment: 'Dịch vụ sử dụng CI này',
  })
  serviceIds: string[];

  // Tags & Classification
  @Column({ name: 'tags', type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ name: 'environment', nullable: true, comment: 'Môi trường (prod/staging/dev/test)' })
  environment?: string;

  @Column({
    name: 'criticality',
    nullable: true,
    comment: 'Mức độ quan trọng (critical/high/medium/low)',
  })
  criticality?: string;

  // Attributes (flexible key-value for CI-specific data)
  @Column({ name: 'attributes', type: 'jsonb', nullable: true })
  attributes?: Record<string, any>;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  get isActive(): boolean {
    return this.status === CiStatus.ACTIVE;
  }

  get isWarrantyExpired(): boolean {
    if (!this.warrantyExpiry) return false;
    return new Date() > this.warrantyExpiry;
  }
}
