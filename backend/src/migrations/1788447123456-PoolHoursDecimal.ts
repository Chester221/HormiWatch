import { MigrationInterface, QueryRunner } from "typeorm";

export class PoolHoursDecimal1788447123456 implements MigrationInterface {
    name = 'PoolHoursDecimal1788447123456'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "pool_hours" TYPE numeric(13,4)`);
        await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "pool_hours" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "hours_consumed" TYPE numeric(13,4)`);
        await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "hours_consumed" SET DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "hours_consumed" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "hours_consumed" TYPE integer`);
        await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "pool_hours" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "pool_hours" TYPE integer`);
    }
}