import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetFields1800005000000 implements MigrationInterface {
  name = 'AddPasswordResetFields1800005000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "password_reset_token_hash" character varying(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "password_reset_expires_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_password_reset_token_hash" ON "users" ("password_reset_token_hash")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."idx_password_reset_token_hash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "password_reset_expires_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "password_reset_token_hash"`,
    );
  }
}
