/**
 * Seed inicial de catálogo de servicios (categorías, plataformas y tipos).
 * Idempotente: limpia basura de prueba y usa ON CONFLICT (name) DO NOTHING.
 * Uso: npm run seed:services
 */
require('dotenv').config();
const { Client } = require('pg');

const CATEGORIES = [
  { name: 'Desarrollo', description: 'Creación y evolución de software' },
  { name: 'Soporte Técnico', description: 'Atención y resolución de incidencias' },
  { name: 'Consultoría', description: 'Asesoría técnica y estratégica' },
  { name: 'Diseño', description: 'Diseño UX/UI y prototipos' },
  { name: 'Infraestructura', description: 'Servidores, cloud y redes' },
  { name: 'Reunión', description: 'Reuniones con clientes o equipo' },
];

const PLATFORMS = [
  { name: 'General', description: 'Plataforma no especificada (por defecto)' },
  { name: 'Web', description: 'Aplicaciones y sitios web' },
  { name: 'Móvil', description: 'Aplicaciones iOS y Android' },
  { name: 'Escritorio', description: 'Software de escritorio' },
  { name: 'Cloud', description: 'Servicios en la nube' },
];

const TYPES = [
  { name: 'General', description: 'Tipo no especificado (por defecto)' },
  { name: 'Proyecto', description: 'Trabajo por proyecto' },
  { name: 'Soporte', description: 'Atención continua' },
  { name: 'Mantenimiento', description: 'Mantenimiento preventivo y correctivo' },
  { name: 'Urgencia', description: 'Atención prioritaria' },
];

async function insert(client, table, rows) {
  for (const row of rows) {
    await client.query(
      `INSERT INTO "${table}" (id, name, description, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
       ON CONFLICT (name) DO NOTHING`,
      [row.name, row.description]
    );
  }
}

async function main() {
  const client = new Client({ connectionString: process.env.DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const junk = await client.query(
      `DELETE FROM "services_category" WHERE name IN ('XDDDD', 'xDDD')`
    );
    console.log(`Basura eliminada de services_category: ${junk.rowCount} fila(s)`);

    await insert(client, 'services_category', CATEGORIES);
    await insert(client, 'services_plaftorms', PLATFORMS);
    await insert(client, 'services_types', TYPES);

    const counts = {};
    for (const table of ['services_category', 'services_plaftorms', 'services_types']) {
      const res = await client.query(`SELECT name FROM "${table}" ORDER BY name`);
      counts[table] = res.rows.map((r) => r.name);
    }
    console.log('services_category:', counts.services_category.join(', '));
    console.log('services_plaftorms:', counts.services_plaftorms.join(', '));
    console.log('services_types:', counts.services_types.join(', '));
  } finally {
    await client.end();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });