import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTaskCreatorAndCompleted1788601000000 implements MigrationInterface {
    name = 'AddTaskCreatorAndCompleted1788601000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" ADD "completed_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "created_by" uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "created_by"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "completed_at"`);
    }

}