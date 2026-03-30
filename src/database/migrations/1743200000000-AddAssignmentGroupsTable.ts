import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Master data nhóm giao việc — incidents.assignee_group_id tham chiếu bảng này.
 */
export class AddAssignmentGroupsTable1743200000000 implements MigrationInterface {
  name = 'AddAssignmentGroupsTable1743200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'assignment_groups',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '64',
            isUnique: true,
            comment: 'Mã nhóm (VD: INC-L1-SD)',
          },
          { name: 'name', type: 'varchar', length: '255', comment: 'Tên hiển thị' },
          { name: 'description', type: 'text', isNullable: true },
          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Liên kết tới organizations (tùy chọn)',
          },
          {
            name: 'practice',
            type: 'varchar',
            length: '32',
            default: "'incidents'",
            comment: 'incidents | problems | changes | service_requests',
          },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'sort_order', type: 'integer', default: 0 },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          { name: 'deleted_at', type: 'timestamp with time zone', isNullable: true },
          { name: 'created_by', type: 'uuid', isNullable: true },
          { name: 'updated_by', type: 'uuid', isNullable: true },
          {
            name: 'version',
            type: 'integer',
            default: 1,
            comment: 'Optimistic locking',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'assignment_groups',
      new TableIndex({
        name: 'IDX_assignment_groups_practice_is_active',
        columnNames: ['practice', 'is_active'],
      }),
    );

    await queryRunner.createForeignKey(
      'assignment_groups',
      new TableForeignKey({
        name: 'FK_assignment_groups_organization',
        columnNames: ['organization_id'],
        referencedTableName: 'organizations',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('assignment_groups');
    const fk = table?.foreignKeys.find((f) => f.name === 'FK_assignment_groups_organization');
    if (fk) {
      await queryRunner.dropForeignKey('assignment_groups', fk);
    }
    await queryRunner.dropTable('assignment_groups');
  }
}
