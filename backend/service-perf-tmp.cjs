const { Pool } = require('pg');

const DB_URL = process.argv[2];

async function main() {
  const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

  const counts = await pool.query(`
    SELECT
      (SELECT count(*) FROM services) AS services,
      (SELECT count(*) FROM tasks) AS tasks,
      (SELECT count(*) FROM services s JOIN tasks t ON t.service_id = s.id) AS service_task_rows
  `);
  console.log('COUNTS:', counts.rows[0]);

  console.log('\n--- EXPLAIN ANALYZE: consulta exacta de ServicesService.findAll (take 10) ---');
  const explain = await pool.query(`
    EXPLAIN ANALYZE
    SELECT DISTINCT
      "service"."id",
      "service"."created_at",
      "service"."updated_at",
      "service"."deleted_at",
      "service"."name",
      "service"."description",
      "service"."hourly_rate",
      "service"."icon",
      "service"."color",
      "service"."created_by",
      "service"."category_id",
      "service"."platform_id",
      "service"."type_id"
    FROM "services" "service"
    LEFT JOIN "service_categories" "category" ON "category"."id" = "service"."category_id"
    LEFT JOIN "service_platforms" "platform" ON "platform"."id" = "service"."platform_id"
    LEFT JOIN "service_types" "type" ON "type"."id" = "service"."type_id"
    LEFT JOIN "tasks" "tasks" ON "tasks"."service_id" = "service"."id"
    LEFT JOIN "users" "createdBy" ON "createdBy"."id" = "service"."created_by"
    LEFT JOIN "user_profiles" "createdByProfile" ON "createdByProfile"."id" = "createdBy"."profile_id"
    ORDER BY "service"."created_at" ASC
    LIMIT 10
    OFFSET 0
  `);
  console.log(explain.rows.map(r => r['QUERY PLAN']).join('\n'));

  console.log('\n--- EXPLAIN ANALYZE: count query ---');
  const explainCount = await pool.query(`
    EXPLAIN ANALYZE
    SELECT COUNT(DISTINCT "service"."id") AS "cnt"
    FROM "services" "service"
    LEFT JOIN "service_categories" "category" ON "category"."id" = "service"."category_id"
    LEFT JOIN "service_platforms" "platform" ON "platform"."id" = "service"."platform_id"
    LEFT JOIN "service_types" "type" ON "type"."id" = "service"."type_id"
    LEFT JOIN "tasks" "tasks" ON "tasks"."service_id" = "service"."id"
    LEFT JOIN "users" "createdBy" ON "createdBy"."id" = "service"."created_by"
    LEFT JOIN "user_profiles" "createdByProfile" ON "createdByProfile"."id" = "createdBy"."profile_id"
  `);
  console.log(explainCount.rows.map(r => r['QUERY PLAN']).join('\n'));

  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });