import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorCustomerRifAndPhones1800008000000
  implements MigrationInterface
{
  name = 'RefactorCustomerRifAndPhones1800008000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // El frontend ya guardaba el RIF dentro de "ruc" (J-12345678-9),
    // así que renombrar conserva los datos existentes.
    await queryRunner.query(`ALTER TABLE "customers" RENAME COLUMN "ruc" TO "rif"`);

    await queryRunner.query(
      `UPDATE "customers" SET "rif" = UPPER(TRIM("rif")) WHERE "rif" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ALTER COLUMN "rif" TYPE character varying(12)`,
    );

    // Teléfono de empresa: 3 columnas separadas. Nullable porque los
    // clientes actuales no tienen estos datos todavía.
    await queryRunner.query(
      `ALTER TABLE "customers" ADD COLUMN "phone_country" character varying(4)`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD COLUMN "phone_area" character varying(6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD COLUMN "phone_number" character varying(15)`,
    );

    // Personas naturales (técnicos): formato internacional libre.
    await queryRunner.query(
      `ALTER TABLE "users_profiles" ALTER COLUMN "phone" TYPE character varying(24)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "users_profiles"
          SET "phone" = LEFT("phone", 16)
        WHERE "phone" IS NOT NULL AND LENGTH("phone") > 16`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_profiles" ALTER COLUMN "phone" TYPE character varying(16)`,
    );
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "phone_number"`);
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "phone_area"`);
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "phone_country"`);
    await queryRunner.query(
      `ALTER TABLE "customers" ALTER COLUMN "rif" TYPE character varying`,
    );
    await queryRunner.query(`ALTER TABLE "customers" RENAME COLUMN "rif" TO "ruc"`);
  }
}
