/**
 * Một lần đồng bộ schema từ entity → PostgreSQL (dev / DB trống).
 * Dự án chưa có migration ban đầu cho toàn bộ domain; dùng script này trước khi seed.
 *
 * Chạy: npm run schema:sync
 */
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'itsm_db',
  schema: process.env.DB_SCHEMA || 'public',
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  synchronize: true,
  logging: process.env.DB_LOGGING === 'true',
});

dataSource
  .initialize()
  .then(async () => {
    console.log('✅ Schema đã đồng bộ với entity (synchronize).');
    await dataSource.destroy();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ schema:sync thất bại:', err);
    process.exit(1);
  });
