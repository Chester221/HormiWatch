/**
 * Asegura las columnas de catálogo en la tabla `services` (tarifa e icono).
 * Idempotente. Uso: node scripts/services-schema.cjs
 */
require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query('ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "hourly_rate" DECIMAL(10,2) NULL');
    await client.query('ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "icon" VARCHAR(50) NULL');
    await client.query('ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "color" VARCHAR(7) NULL');
    await client.query('ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "created_by" UUID NULL');
    const res = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'services' ORDER BY ordinal_position`
    );
    console.log('services columns:', res.rows.map((r) => r.column_name).join(', '));
  } finally {
    await client.end();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });