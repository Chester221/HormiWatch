import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateNotificationThresholds1800003000000 implements MigrationInterface {
  name = 'UpdateNotificationThresholds1800003000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Normaliza los thresholds guardados (los filas creadas con la migracion
    // anterior quedaron con taskStaleDays: 5).
    await queryRunner.query(
      `UPDATE "notification_settings"
       SET "thresholds" = jsonb_set("thresholds", '{taskStaleDays}', '3'::jsonb, true)
       WHERE "thresholds" IS NOT NULL AND "thresholds"->>'taskStaleDays' IS DISTINCT FROM '3'`,
    );

    // Default de la columna para filas nuevas.
    await queryRunner.query(
      `ALTER TABLE "notification_settings" ALTER COLUMN "thresholds" SET DEFAULT '{"yellow":80,"orange":95,"red":100,"expiringDays":15,"inactivityDays":3,"taskStaleDays":3}'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "notification_settings"
       SET "thresholds" = jsonb_set("thresholds", '{taskStaleDays}', '5'::jsonb, true)
       WHERE "thresholds" IS NOT NULL AND "thresholds"->>'taskStaleDays' = '3'`,
    );

    await queryRunner.query(
      `ALTER TABLE "notification_settings" ALTER COLUMN "thresholds" SET DEFAULT '{"yellow":80,"orange":95,"red":100,"expiringDays":15,"inactivityDays":3,"taskStaleDays":5}'::jsonb`,
    );
  }
}
