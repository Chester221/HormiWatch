import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTaskFactorBreakdown1788800000000 implements MigrationInterface {
    name = 'AddTaskFactorBreakdown1788800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" ADD "factor_breakdown" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "factor_breakdown"`);
    }

}