import { MigrationInterface, QueryRunner, Table, TableIndex, TableUnique } from 'typeorm';

/**
 * Tạo 2 bảng cho hệ thống Object Locking:
 * - object_locking_configs: Admin cấu hình locking policy per object type
 * - object_locks: Active pessimistic locks (hard-delete khi release)
 */
export class AddObjectLockingTables1743123600000 implements MigrationInterface {
  name = 'AddObjectLockingTables1743123600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // Bảng 1: object_locking_configs
    // ============================================================
    await queryRunner.createTable(
      new Table({
        name: 'object_locking_configs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'object_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
            isUnique: true,
            comment: 'Loại object áp dụng locking: incident | change | problem | service_request | ...',
          },
          {
            name: 'locking_mode',
            type: 'varchar',
            length: '20',
            isNullable: false,
            default: "'pessimistic'",
            comment: 'Chế độ: none | optimistic | pessimistic | both',
          },
          {
            name: 'is_enabled',
            type: 'boolean',
            isNullable: false,
            default: true,
            comment: 'Bật/tắt locking cho object type này',
          },
          {
            name: 'lock_timeout_mins',
            type: 'integer',
            isNullable: false,
            default: 30,
            comment: 'Thời gian lock tự động hết hạn (phút)',
          },
          {
            name: 'conditions',
            type: 'jsonb',
            isNullable: true,
            comment: 'Điều kiện JSON để quyết định bản ghi có cần lock không. Null = luôn lock.',
          },
          {
            name: 'apply_to_roles',
            type: 'varchar',
            isArray: true,
            isNullable: true,
            comment: 'Danh sách role bị áp dụng. Null = tất cả roles.',
          },
          {
            name: 'description',
            type: 'varchar',
            length: '500',
            isNullable: true,
            comment: 'Mô tả mục đích cấu hình',
          },
          // BaseEntity fields
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
            comment: 'Thời điểm tạo',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
            comment: 'Thời điểm cập nhật cuối',
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Soft delete timestamp',
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
            comment: 'User tạo cấu hình',
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
            comment: 'User cập nhật cấu hình cuối',
          },
          {
            name: 'version',
            type: 'integer',
            isNullable: false,
            default: 1,
            comment: 'Optimistic locking version counter',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'object_locking_configs',
      new TableIndex({
        name: 'IDX_object_locking_configs_object_type',
        columnNames: ['object_type'],
        isUnique: true,
      }),
    );

    // ============================================================
    // Bảng 2: object_locks — active pessimistic locks
    // ============================================================
    await queryRunner.createTable(
      new Table({
        name: 'object_locks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'object_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Loại object đang bị lock',
          },
          {
            name: 'object_id',
            type: 'uuid',
            isNullable: false,
            comment: 'ID bản ghi đang bị lock',
          },
          {
            name: 'locked_by',
            type: 'uuid',
            isNullable: false,
            comment: 'ID user đang giữ lock',
          },
          {
            name: 'locked_by_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Tên đầy đủ user giữ lock — để hiển thị thông báo cho user khác',
          },
          {
            name: 'locked_at',
            type: 'timestamp with time zone',
            default: 'now()',
            comment: 'Thời điểm lock được tạo',
          },
          {
            name: 'expires_at',
            type: 'timestamp with time zone',
            isNullable: false,
            comment: 'Thời điểm lock tự động hết hạn',
          },
          {
            name: 'session_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Browser session/tab ID để phân biệt nhiều tab của cùng user',
          },
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_object_locks_object_type_object_id',
            columnNames: ['object_type', 'object_id'],
          }),
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'object_locks',
      new TableIndex({
        name: 'IDX_object_locks_locked_by',
        columnNames: ['locked_by'],
      }),
    );

    await queryRunner.createIndex(
      'object_locks',
      new TableIndex({
        name: 'IDX_object_locks_expires_at',
        columnNames: ['expires_at'],
      }),
    );

    await queryRunner.createIndex(
      'object_locks',
      new TableIndex({
        name: 'IDX_object_locks_object_type_object_id',
        columnNames: ['object_type', 'object_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('object_locks', 'IDX_object_locks_object_type_object_id');
    await queryRunner.dropIndex('object_locks', 'IDX_object_locks_expires_at');
    await queryRunner.dropIndex('object_locks', 'IDX_object_locks_locked_by');
    await queryRunner.dropTable('object_locks');

    await queryRunner.dropIndex(
      'object_locking_configs',
      'IDX_object_locking_configs_object_type',
    );
    await queryRunner.dropTable('object_locking_configs');
  }
}
