require('dotenv').config();
const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const r = await c.query(`SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='assigned_technicians'
    ORDER BY ordinal_position`);
  r.rows.forEach((x) => {
    console.log(`${x.column_name} (${x.data_type}${x.is_nullable === 'NO' ? ' NOT NULL' : ''})`);
  });
  await c.end();
})().catch((e) => { console.error(e); process.exit(1); });