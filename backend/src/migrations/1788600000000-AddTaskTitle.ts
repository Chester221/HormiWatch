import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTaskTitle1788600000000 implements MigrationInterface {
    name = 'AddTaskTitle1788600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" ADD "title" character varying(120)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "title"`);
    }

}