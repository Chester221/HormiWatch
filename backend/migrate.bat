@echo off
echo ==========================================
echo MIGRACION SUPABASE -> NEON
echo ==========================================
echo.
echo ATENCION: Esta migracion ya se realizo.
echo Los scripts de migracion se mantienen con fines historicos.
echo.
echo Las credenciales reales se eliminaron de este archivo por seguridad.
echo Para reutilizar, configurar las variables de entorno:
echo   SUPABASE_DB_URL y NEON_DB_URL
echo.
if "%SUPABASE_DB_URL%"=="" (
  echo ERROR: Variable SUPABASE_DB_URL no definida.
  echo Configurala antes de ejecutar: set SUPABASE_DB_URL=postgresql://...
  exit /b 1
)
if "%NEON_DB_URL%"=="" (
  echo ERROR: Variable NEON_DB_URL no definida.
  echo Configurala antes de ejecutar: set NEON_DB_URL=postgresql://...
  exit /b 1
)

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
