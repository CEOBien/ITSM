import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddSystemMetricsTable1743007200000 implements MigrationInterface {
  name = 'AddSystemMetricsTable1743007200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'system_metrics',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'timestamp',
            type: 'timestamp with time zone',
            default: 'now()',
            comment: 'Thời điểm thu thập snapshot',
          },
          // CPU
          { name: 'cpu_usage_percent', type: 'decimal', precision: 5, scale: 2, default: '0' },
          { name: 'cpu_cores', type: 'integer' },
          { name: 'load_avg_1m', type: 'decimal', precision: 6, scale: 2, default: '0' },
          { name: 'load_avg_5m', type: 'decimal', precision: 6, scale: 2, default: '0' },
          { name: 'load_avg_15m', type: 'decimal', precision: 6, scale: 2, default: '0' },
          // Memory
          { name: 'memory_total_mb', type: 'integer' },
          { name: 'memory_used_mb', type: 'integer' },
          { name: 'memory_free_mb', type: 'integer' },
          { name: 'memory_usage_percent', type: 'decimal', precision: 5, scale: 2, default: '0' },
          // Node process
          { name: 'heap_used_mb', type: 'integer' },
          { name: 'heap_total_mb', type: 'integer' },
          { name: 'heap_external_mb', type: 'integer', default: '0' },
          { name: 'rss_mb', type: 'integer' },
          // Application
          { name: 'active_connections', type: 'integer', default: '0' },
          { name: 'requests_per_minute', type: 'integer', default: '0' },
          { name: 'error_count_per_minute', type: 'integer', default: '0' },
          // Meta
          { name: 'uptime_seconds', type: 'integer' },
          { name: 'node_version', type: 'varchar', length: '30' },
          { name: 'platform', type: 'varchar', length: '20' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'system_metrics',
      new TableIndex({
        name: 'IDX_system_metrics_timestamp',
        columnNames: ['timestamp'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('system_metrics', 'IDX_system_metrics_timestamp');
    await queryRunner.dropTable('system_metrics');
  }
}
