import { MigrationInterface, QueryRunner } from 'typeorm';

export class WidenCustomerContactPhone1800007000000
  implements MigrationInterface
{
  name = 'WidenCustomerContactPhone1800007000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Los teléfonos con formato internacional (+58 412...) excedían varchar(16).
    await queryRunner.query(
      `ALTER TABLE "customers_contacts" ALTER COLUMN "phone" TYPE character varying(24)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recorta cualquier valor largo antes de volver al tamaño anterior para
    // que el rollback no falle por "value too long".
    await queryRunner.query(
      `UPDATE "customers_contacts"
          SET "phone" = LEFT("phone", 16)
        WHERE "phone" IS NOT NULL AND LENGTH("phone") > 16`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers_contacts" ALTER COLUMN "phone" TYPE character varying(16)`,
    );
  }
}
