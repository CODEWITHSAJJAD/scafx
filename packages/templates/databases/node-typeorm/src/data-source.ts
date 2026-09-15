import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/app_db',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: false,
  entities: [User],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});
