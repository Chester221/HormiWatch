import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeProjectContactNullable1800000000001 implements MigrationInterface {
    name = 'MakeProjectContactNullable1800000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ✅ Permite eliminar un cliente cuyos contactos estén referenciados por
        // proyectos soft-deleted: al borrar el cliente se desvinculan esos
        // proyectos (customer_contact_id queda NULL) sin perder los registros.
        await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "customer_contact_id" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" ALTER COLUMN "customer_contact_id" SET NOT NULL`);
    }

}