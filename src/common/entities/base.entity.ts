import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  VersionColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { IBaseEntity } from '../interfaces';

/**
 * Base Entity - All entities should extend this class
 * Provides common fields following ITIL best practices for audit trails
 */
export abstract class BaseEntity implements IBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
    comment: 'Record creation timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
    comment: 'Record last update timestamp',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Soft delete timestamp',
  })
  @Exclude()
  deletedAt?: Date;

  @Column({
    name: 'created_by',
    type: 'uuid',
    nullable: true,
    comment: 'User who created this record',
  })
  createdBy?: string;

  @Column({
    name: 'updated_by',
    type: 'uuid',
    nullable: true,
    comment: 'User who last updated this record',
  })
  updatedBy?: string;

  @VersionColumn({
    name: 'version',
    comment: 'Optimistic locking version counter',
  })
  version: number;

  @BeforeInsert()
  setCreatedAt() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  setUpdatedAt() {
    this.updatedAt = new Date();
  }
}
