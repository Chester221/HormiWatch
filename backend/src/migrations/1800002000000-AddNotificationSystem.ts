import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationSystem1800002000000 implements MigrationInterface {
  name = 'AddNotificationSystem1800002000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_category_enum" AS ENUM('contracts', 'projects', 'tasks', 'users', 'system', 'customers')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_level_enum" AS ENUM('info', 'warning', 'critical')`,
    );

    await queryRunner.query(
      `CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "user_id" uuid NOT NULL,
        "category" "public"."notifications_category_enum" NOT NULL,
        "level" "public"."notifications_level_enum" NOT NULL DEFAULT 'info',
        "title" character varying(200) NOT NULL,
        "message" text NOT NULL,
        "data" jsonb,
        "event_key" character varying(200),
        "read_at" TIMESTAMP,
        "digest_sent" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_read_at" ON "notifications" ("user_id", "read_at")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_notifications_user_event_key" ON "notifications" ("user_id", "event_key") WHERE "event_key" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user"
       FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "notification_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "channels" jsonb NOT NULL DEFAULT '{"inApp":true,"email":true,"discord":true,"whatsapp":false}',
        "thresholds" jsonb NOT NULL DEFAULT '{"yellow":80,"orange":95,"red":100,"expiringDays":15,"inactivityDays":3,"taskStaleDays":5}',
        "event_toggles" jsonb NOT NULL DEFAULT '{}',
        "discord" jsonb NOT NULL DEFAULT '{}',
        "digest_hour" integer NOT NULL DEFAULT 8,
        "digest_enabled" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_notification_settings" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `INSERT INTO "notification_settings" ("id") SELECT uuid_generate_v4() WHERE NOT EXISTS (SELECT 1 FROM "notification_settings")`,
    );

    await queryRunner.query(
      `ALTER TABLE "users_profiles" ADD "whatsapp_phone" character varying(20)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users_profiles" DROP COLUMN "whatsapp_phone"`,
    );
    await queryRunner.query(`DROP TABLE "notification_settings"`);
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_notifications_user_event_key"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_notifications_user_read_at"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_level_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_category_enum"`);
  }
}
