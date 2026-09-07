import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFrontendFields1788446628409 implements MigrationInterface {
    name = 'AddFrontendFields1788446628409'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(15) NOT NULL, "description" character varying(100), CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_role_name" ON "roles" ("name") `);
        await queryRunner.query(`CREATE TABLE "users_profiles" ("id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(50) NOT NULL, "last_name" character varying(50), "phone" character varying(16), "idCard" character varying(15), "position" character varying(40), "deparment" character varying(50), "profilePicture" character varying, "avatar_url" character varying, "full_name" character varying, "user_id" uuid NOT NULL, CONSTRAINT "REL_181a055631e557898c3eea0f37" UNIQUE ("user_id"), CONSTRAINT "PK_e7a7f7db3fc96700d9239e43cda" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "country" character varying(60), "city" character varying(60), "address" character varying, CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "customers_contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(60) NOT NULL, "last_name" character varying(60) NOT NULL, "id_card" character varying(15), "position" character varying(100), "phone" character varying(16), "email" character varying(100), "customer_id" uuid, CONSTRAINT "PK_7a44625467ff1f4f0fe71fa714b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "services_category" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(100) NOT NULL, "description" character varying, CONSTRAINT "UQ_45b3d18e02216dc1f7b10125eb9" UNIQUE ("name"), CONSTRAINT "PK_1f8d1173481678a035b4a81a4ec" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_category_service" ON "services_category" ("name") `);
        await queryRunner.query(`CREATE TABLE "services_plaftorms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(100) NOT NULL, "description" character varying, CONSTRAINT "UQ_ce75c9c1c8a428f3d970e53b46e" UNIQUE ("name"), CONSTRAINT "PK_f6a1c7408842ca579fe5e51e4da" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_platform_service" ON "services_plaftorms" ("name") `);
        await queryRunner.query(`CREATE TABLE "services_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(100) NOT NULL, "description" character varying, CONSTRAINT "UQ_cf3c414cf1acaccb3a97108eebe" UNIQUE ("name"), CONSTRAINT "PK_7cf0b72d9dacbbaa7c904670ee7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_type_service" ON "services_types" ("name") `);
        await queryRunner.query(`CREATE TABLE "services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying(100) NOT NULL, "description" character varying, "category_id" uuid NOT NULL, "platform_id" uuid NOT NULL, "type_id" uuid NOT NULL, CONSTRAINT "UQ_019d74f7abcdcb5a0113010cb03" UNIQUE ("name"), CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_name_service" ON "services" ("name") `);
        await queryRunner.query(`CREATE TYPE "public"."tasks_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TYPE "public"."tasks_execution_type_enum" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')`);
        await queryRunner.query(`CREATE TYPE "public"."tasks_priority_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'EMERGENCY')`);
        await queryRunner.query(`CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "start_datetime" TIMESTAMP NOT NULL, "end_datetime" TIMESTAMP NOT NULL, "status" "public"."tasks_status_enum", "execution_type" "public"."tasks_execution_type_enum", "priority" "public"."tasks_priority_enum" NOT NULL, "description" character varying, "applied_hourly_rate" numeric(13,4) NOT NULL DEFAULT '0', "technician_id" uuid NOT NULL, "project_id" uuid, "service_id" uuid NOT NULL, CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_73cde966b8608a767ccbadb639" ON "tasks" ("execution_type", "start_datetime") `);
        await queryRunner.query(`CREATE INDEX "IDX_ebf678110d79e06fe84da17ad9" ON "tasks" ("priority", "start_datetime") `);
        await queryRunner.query(`CREATE INDEX "IDX_b2772c1e700ba71b3d8f444b32" ON "tasks" ("status", "start_datetime") `);
        await queryRunner.query(`CREATE INDEX "IDX_8ad4b3144c7829d3e5ed08ebd0" ON "tasks" ("service_id", "start_datetime") `);
        await queryRunner.query(`CREATE INDEX "IDX_1528d298bbe598369d2da15852" ON "tasks" ("technician_id", "start_datetime") `);
        await queryRunner.query(`CREATE INDEX "IDX_0b86e389b6d4414db9ab52c51c" ON "tasks" ("project_id", "start_datetime") `);
        await queryRunner.query(`CREATE TYPE "public"."projects_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "title" character varying(100) NOT NULL, "description" text, "hourly_rate" numeric(13,4) NOT NULL DEFAULT '0', "status" "public"."projects_status_enum", "pool_hours" integer NOT NULL DEFAULT '0', "start_date" date NOT NULL, "end_date" date NOT NULL, "client_id" character varying, "customer_id" character varying, "hours_consumed" integer DEFAULT '0', "project_leader_id" uuid NOT NULL, "customer_contact_id" uuid NOT NULL, CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "password" character varying NOT NULL, "email" character varying(100) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "lastConnection" TIMESTAMP, "refreshToken" character varying, "auth_user_id" character varying, "preferences" jsonb DEFAULT '{}', "role_id" uuid NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_email" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "idx_is_actived_user" ON "users" ("is_active") `);
        await queryRunner.query(`CREATE TABLE "holidays" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "date" date NOT NULL, "name" character varying(100) NOT NULL, "description" character varying(255), "is_working_day" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_3646bdd4c3817d954d830881dfe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notification_preferences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "email_active" boolean NOT NULL DEFAULT true, "whatsapp_active" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_e94e2b543f2f218ee68e4f4fad2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."audit_logs_action_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE')`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "action" "public"."audit_logs_action_enum" NOT NULL, "affected_entity" character varying NOT NULL, "user_name" character varying(70), "old_values" json, "new_values" json, CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "assigned_technicians" ("project_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_1f15db2eb4ee46dfb2c05076496" PRIMARY KEY ("project_id", "user_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cebc56d1745acde9b4ba11824b" ON "assigned_technicians" ("project_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_37bbd42becdcb6eca5ea3306c9" ON "assigned_technicians" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "users_profiles" ADD CONSTRAINT "FK_181a055631e557898c3eea0f37e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers_contacts" ADD CONSTRAINT "FK_4b9e4b0e6b41c1962ba47de7c96" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "services" ADD CONSTRAINT "FK_1f8d1173481678a035b4a81a4ec" FOREIGN KEY ("category_id") REFERENCES "services_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "services" ADD CONSTRAINT "FK_449c36fa09562f61770f0c4486e" FOREIGN KEY ("platform_id") REFERENCES "services_plaftorms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "services" ADD CONSTRAINT "FK_89bf3b07b93e8258d5fc7d64568" FOREIGN KEY ("type_id") REFERENCES "services_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_ace74a211fad775871b3d70770c" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_9eecdb5b1ed8c7c2a1b392c28d4" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_e386ab36d7390d85584cf50ffe5" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_9034c9c8487f6d4fd2c6964ee18" FOREIGN KEY ("project_leader_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_df5c26b3a34eb394451ce59e444" FOREIGN KEY ("customer_contact_id") REFERENCES "customers_contacts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assigned_technicians" ADD CONSTRAINT "FK_cebc56d1745acde9b4ba11824b6" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "assigned_technicians" ADD CONSTRAINT "FK_37bbd42becdcb6eca5ea3306c9f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assigned_technicians" DROP CONSTRAINT "FK_37bbd42becdcb6eca5ea3306c9f"`);
        await queryRunner.query(`ALTER TABLE "assigned_technicians" DROP CONSTRAINT "FK_cebc56d1745acde9b4ba11824b6"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_df5c26b3a34eb394451ce59e444"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_9034c9c8487f6d4fd2c6964ee18"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_e386ab36d7390d85584cf50ffe5"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_9eecdb5b1ed8c7c2a1b392c28d4"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_ace74a211fad775871b3d70770c"`);
        await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "FK_89bf3b07b93e8258d5fc7d64568"`);
        await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "FK_449c36fa09562f61770f0c4486e"`);
        await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "FK_1f8d1173481678a035b4a81a4ec"`);
        await queryRunner.query(`ALTER TABLE "customers_contacts" DROP CONSTRAINT "FK_4b9e4b0e6b41c1962ba47de7c96"`);
        await queryRunner.query(`ALTER TABLE "users_profiles" DROP CONSTRAINT "FK_181a055631e557898c3eea0f37e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_37bbd42becdcb6eca5ea3306c9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cebc56d1745acde9b4ba11824b"`);
        await queryRunner.query(`DROP TABLE "assigned_technicians"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);
        await queryRunner.query(`DROP TABLE "notification_preferences"`);
        await queryRunner.query(`DROP TABLE "holidays"`);
        await queryRunner.query(`DROP INDEX "public"."idx_is_actived_user"`);
        await queryRunner.query(`DROP INDEX "public"."idx_email"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`DROP TYPE "public"."projects_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0b86e389b6d4414db9ab52c51c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1528d298bbe598369d2da15852"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8ad4b3144c7829d3e5ed08ebd0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b2772c1e700ba71b3d8f444b32"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ebf678110d79e06fe84da17ad9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_73cde966b8608a767ccbadb639"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_priority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_execution_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_name_service"`);
        await queryRunner.query(`DROP TABLE "services"`);
        await queryRunner.query(`DROP INDEX "public"."idx_type_service"`);
        await queryRunner.query(`DROP TABLE "services_types"`);
        await queryRunner.query(`DROP INDEX "public"."idx_platform_service"`);
        await queryRunner.query(`DROP TABLE "services_plaftorms"`);
        await queryRunner.query(`DROP INDEX "public"."idx_category_service"`);
        await queryRunner.query(`DROP TABLE "services_category"`);
        await queryRunner.query(`DROP TABLE "customers_contacts"`);
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`DROP TABLE "users_profiles"`);
        await queryRunner.query(`DROP INDEX "public"."idx_role_name"`);
        await queryRunner.query(`DROP TABLE "roles"`);
    }

}
