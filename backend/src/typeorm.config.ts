import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

console.log('DB_URL:', process.env.DB_URL ? '✅ CONFIGURADA' : '❌ NO ENCONTRADA');

export default new DataSource({
  type: 'postgres',
  url: process.env.DB_URL,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  ssl: {
    rejectUnauthorized: false,
  },
});