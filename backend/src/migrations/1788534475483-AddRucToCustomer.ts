import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRucToCustomer1788534475483 implements MigrationInterface {
    name = 'AddRucToCustomer1788534475483'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "notification_preferences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "email_active" boolean NOT NULL DEFAULT true, "whatsapp_active" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_e94e2b543f2f218ee68e4f4fad2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."audit_logs_action_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE')`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "action" "public"."audit_logs_action_enum" NOT NULL, "affected_entity" character varying NOT NULL, "user_name" character varying(70), "old_values" json, "new_values" json, CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "ruc" character varying`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "country"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "country" character varying`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "city" character varying`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "address" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "address" character varying`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "city" character varying(60)`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "country"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "country" character varying(60)`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "ruc"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);
        await queryRunner.query(`DROP TABLE "notification_preferences"`);
    }

}
