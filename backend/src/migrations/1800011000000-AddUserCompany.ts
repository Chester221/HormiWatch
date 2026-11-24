import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * La tabla users_profiles necesita la empresa del usuario para diferenciar
 * a los miembros de Bytes Creativos de los de Gal Secure.
 */
export class AddUserCompany1800011000000 implements MigrationInterface {
  name = 'AddUserCompany1800011000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users_profiles',
      new TableColumn({
        name: 'company',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users_profiles', 'company');
  }
}
