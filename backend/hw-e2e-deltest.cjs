require('dotenv').config();
const argon2 = require('argon2');
const { Client } = require('pg');
const { v4 } = require('uuid');
const PEP = process.env.HASH_PEPPER || 'default_secret_pepper';
const ADMIN_ID = v4(), PROBE_ID = v4(), PROBE2_ID = v4();
async function api(path, { method = 'GET', token, body } = {}) {
  const r = await fetch('http://localhost:3000/api/v1' + path, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch {}
  return { status: r.status, json: j };
}
(async () => {
  const c = new Client({ connectionString: process.env.DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const q = (s, v) => c.query(s, v);
  const inEm = () => `IN ('hw_e2e_admin@test.com','hw_e2e_probe@test.com','hw_e2e_probe2@test.com')`;
  await q(`DELETE FROM users_profiles WHERE user_id IN (SELECT id FROM users WHERE email ${inEm()})`).catch(()=>{});
  await q(`DELETE FROM assigned_technicians WHERE user_id IN (SELECT id FROM users WHERE email ${inEm()})`).catch(()=>{});
  await q(`DELETE FROM users WHERE email ${inEm()}`).catch(()=>{});

  const roles = await q("SELECT id,name FROM roles");
  const adminRole = roles.rows.find((r) => r.name === 'Admin').id;
  const techRole = roles.rows.find((r) => r.name === 'Technician').id;

  const aHash = await argon2.hash('Ada@2026E2E!', { type: argon2.argon2id, secret: Buffer.from(PEP) });
  await q(`INSERT INTO users (id,email,password,role_id,is_active,created_at,updated_at) VALUES
    ('${ADMIN_ID}','hw_e2e_admin@test.com','${aHash}','${adminRole}',true,now(),now())`);
  await q(`INSERT INTO users_profiles (id,user_id,name,last_name,created_at,updated_at) VALUES
    ('${ADMIN_ID}','${ADMIN_ID}','E2E','Root',now(),now())`);

  const login = await api('/auth/login', { method: 'POST', body: { email: 'hw_e2e_admin@test.com', password: 'Ada@2026E2E!' } });
  const token = login.json?.data?.accessToken || login.json?.accessToken || login.json?.access_token;
  console.log('LOGIN:', login.status, 'token:', token ? 'OK' : 'NONE');

  // PROBE 1: SIN relación
  const p1 = await argon2.hash('Probe@2026!', { type: argon2.argon2id, secret: Buffer.from(PEP) });
  await q(`INSERT INTO users (id,email,password,role_id,is_active,created_at,updated_at) VALUES
    ('${PROBE_ID}','hw_e2e_probe@test.com','${p1}','${techRole}',true,now(),now())`);
  await q(`INSERT INTO users_profiles (id,user_id,name,last_name,created_at,updated_at) VALUES
    ('${PROBE_ID}','${PROBE_ID}','Probe','One',now(),now())`);
  const d1 = await api(`/users/${PROBE_ID}`, { method: 'DELETE', token });
  console.log('DELETE sin relación:', d1.status, JSON.stringify(d1.json || {}).slice(0, 150));

  // PROBE 2: CON relación (assigned_technicians)
  const p2 = await argon2.hash('Probe@2026!', { type: argon2.argon2id, secret: Buffer.from(PEP) });
  await q(`INSERT INTO users (id,email,password,role_id,is_active,created_at,updated_at) VALUES
    ('${PROBE2_ID}','hw_e2e_probe2@test.com','${p2}','${techRole}',true,now(),now())`);
  await q(`INSERT INTO users_profiles (id,user_id,name,last_name,created_at,updated_at) VALUES
    ('${PROBE2_ID}','${PROBE2_ID}','Probe','Two',now(),now())`);
  const proj = await q("SELECT id FROM projects ORDER BY created_at DESC LIMIT 1");
  await q(`INSERT INTO assigned_technicians (user_id,project_id,created_at,updated_at)
    VALUES ('${PROBE2_ID}','${proj.rows[0].id}',now(),now())`);
  const d2 = await api(`/users/${PROBE2_ID}`, { method: 'DELETE', token });
  console.log('DELETE con relación:', d2.status, JSON.stringify(d2.json || {}).slice(0, 200));

  // cleanup
  await q(`DELETE FROM assigned_technicians WHERE user_id='${PROBE2_ID}'`).catch(()=>{});
  await q(`DELETE FROM users_profiles WHERE user_id='${PROBE2_ID}'`).catch(()=>{});
  await q(`DELETE FROM users WHERE id='${PROBE2_ID}'`).catch(()=>{});
  await q(`DELETE FROM users_profiles WHERE user_id='${ADMIN_ID}'`).catch(()=>{});
  await q(`DELETE FROM users WHERE id='${ADMIN_ID}'`).catch(()=>{});
  console.log('lipieza ok');
  await c.end();
})().catch((e) => { console.error(e); process.exit(1); });