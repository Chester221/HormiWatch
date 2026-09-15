const pg = require('pg');
const c = new pg.Client({
  connectionString: process.env.PGURL,
  ssl: { rejectUnauthorized: false },
});
(async () => {
  await c.connect();
  const r = await c.query(`
    SELECT u.id, u.email, u.is_active, r.name AS role
    FROM users u LEFT JOIN roles r ON r.id = u.role_id
    ORDER BY r.name, u.email
  `);
  console.log('TOTAL=' + r.rows.length);
  const admins = r.rows.filter((x) => x.role === 'Admin');
  const activeAdmins = admins.filter((a) => a.is_active !== false);
  console.log('ROLE_Admin=' + admins.length + '  ACTIVE_Admins=' + activeAdmins.length);
  for (const a of admins) {
    console.log('ADMIN|' + a.email + '|active=' + a.is_active + '|id=' + String(a.id).slice(0, 12));
  }
  await c.end();
})().catch((e) => { console.error('PROBE_ERR', e.message); process.exit(2); });
