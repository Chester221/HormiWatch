-- =====================================================================
-- HormiWatch - Sistema de notificaciones
-- Ejecutar en el editor SQL de Railway / Neon (Postgres).
-- Equivale a la migracion TypeORM 1800002000000-AddNotificationSystem.
-- Es idempotente: se puede ejecutar varias veces sin romper nada.
-- =====================================================================

-- Extension necesaria para uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Enums -----------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "public"."notifications_category_enum"
    AS ENUM ('contracts', 'projects', 'tasks', 'users', 'system', 'customers');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."notifications_level_enum"
    AS ENUM ('info', 'warning', 'critical');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2) Tabla notifications ----------------------------------------------------
CREATE TABLE IF NOT EXISTS "notifications" (
  "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at"  TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at"  TIMESTAMP NOT NULL DEFAULT now(),
  "deleted_at"  TIMESTAMP,
  "user_id"     uuid NOT NULL,
  "category"    "public"."notifications_category_enum" NOT NULL,
  "level"       "public"."notifications_level_enum" NOT NULL DEFAULT 'info',
  "title"       character varying(200) NOT NULL,
  "message"     text NOT NULL,
  "data"        jsonb,
  "event_key"   character varying(200),
  "read_at"     TIMESTAMP,
  "digest_sent" boolean NOT NULL DEFAULT false,
  CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_notifications_user_read_at"
  ON "notifications" ("user_id", "read_at");

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_notifications_user_event_key"
  ON "notifications" ("user_id", "event_key")
  WHERE "event_key" IS NOT NULL;

DO $$ BEGIN
  ALTER TABLE "notifications"
    ADD CONSTRAINT "FK_notifications_user"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3) Tabla notification_settings (singleton) --------------------------------
CREATE TABLE IF NOT EXISTS "notification_settings" (
  "id"             uuid NOT NULL DEFAULT uuid_generate_v4(),
  "created_at"     TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at"     TIMESTAMP NOT NULL DEFAULT now(),
  "deleted_at"     TIMESTAMP,
  "channels"       jsonb NOT NULL DEFAULT '{"inApp":true,"email":true,"discord":true,"whatsapp":false}',
  "thresholds"     jsonb NOT NULL DEFAULT '{"yellow":80,"orange":95,"red":100,"expiringDays":15,"inactivityDays":3,"taskStaleDays":3}',
  "event_toggles"  jsonb NOT NULL DEFAULT '{}',
  "discord"        jsonb NOT NULL DEFAULT '{}',
  "digest_hour"    integer NOT NULL DEFAULT 8,
  "digest_enabled" boolean NOT NULL DEFAULT true,
  CONSTRAINT "PK_notification_settings" PRIMARY KEY ("id")
);

-- Fila unica de configuracion
INSERT INTO "notification_settings" ("id")
SELECT uuid_generate_v4()
WHERE NOT EXISTS (SELECT 1 FROM "notification_settings");

-- 4) Columna whatsapp_phone en perfiles -------------------------------------
ALTER TABLE "users_profiles"
  ADD COLUMN IF NOT EXISTS "whatsapp_phone" character varying(20);

-- 5) Verificacion -----------------------------------------------------------
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('notifications', 'notification_settings');
