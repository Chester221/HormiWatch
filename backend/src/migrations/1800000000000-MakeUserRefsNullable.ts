import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeUserRefsNullable1800000000000 implements MigrationInterface {
    name = 'MakeUserRefsNullable1800000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ✅ Permiten "eliminación forzada" de cuenta: al borrar un usuario con
        // datos asociados, las tareas quedan sin técnico y los proyectos sin
        // líder asignado (los registros se conservan, no se pierden).
        await queryRunner.query(`ALTER TABLE "tasks" ALTER COLUMN "technician_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "project_leader_id" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "project_leader_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tasks" ALTER COLUMN "technician_id" SET NOT NULL`);
    }

}