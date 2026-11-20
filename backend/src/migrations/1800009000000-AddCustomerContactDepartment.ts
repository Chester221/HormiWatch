import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerContactDepartment1800009000000
  implements MigrationInterface
{
  name = 'AddCustomerContactDepartment1800009000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // El formulario ya enviaba `department`, pero no existía columna y el
    // servicio lo descartaba. Se guarda como nullable para no alterar datos
    // existentes.
    await queryRunner.query(
      `ALTER TABLE "customers_contacts" ADD "department" character varying(100)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "customers_contacts" DROP COLUMN "department"`,
    );
  }
}
