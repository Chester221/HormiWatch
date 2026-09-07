@echo off
echo ==========================================
echo MIGRACION SUPABASE -> NEON
echo ==========================================
echo.

set SUPABASE_DB_URL=postgresql://postgres:04263643667j.@db.tniprkdojqzpicukqvbe.supabase.co:5432/postgres
set NEON_DB_URL=postgresql://neondb_owner:npg_z49ULyiVjNdY@ep-crimson-waterfall-axw0klvr-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

echo PASO 1: Exportando esquema desde Supabase...
pg_dump --dbname="%SUPABASE_DB_URL%" --schema=public --schema-only --no-owner --no-privileges --verbose --file="schema.sql"

echo PASO 2: Exportando datos desde Supabase...
pg_dump --dbname="%SUPABASE_DB_URL%" --schema=public --data-only --format=custom --no-owner --no-privileges --verbose --file="data.dump"

echo PASO 3: Restaurando esquema en Neon...
psql "%NEON_DB_URL%" --set ON_ERROR_STOP=1 --file="schema.sql"

echo PASO 4: Restaurando datos en Neon...
pg_restore --dbname="%NEON_DB_URL%" --data-only --no-owner --no-privileges --verbose --exit-on-error "data.dump"

echo ==========================================
echo MIGRACION COMPLETADA!
echo ==========================================
pause