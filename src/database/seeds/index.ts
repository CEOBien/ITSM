import * as dotenv from 'dotenv';
dotenv.config();

import { DataSource } from 'typeorm';
import { join } from 'path';
import { runSeed } from './initial-data.seed';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'itsm_db',
  entities: [join(__dirname, '../../**/*.entity{.ts,.js}')],
  synchronize: false,
  logging: false,
});

dataSource
  .initialize()
  .then(async () => {
    console.log('📦 Connected to database');
    await runSeed(dataSource);
    await dataSource.destroy();
    console.log('🎉 Database seeding completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
