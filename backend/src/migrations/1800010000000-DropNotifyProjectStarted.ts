import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * El flag notify_project_started nunca fue leído por el backend: la UI mostraba
 * un toggle que no tenía efecto. Se elimina la columna y el campo del DTO.
 */
export class DropNotifyProjectStarted1800010000000
  implements MigrationInterface
{
  name = 'DropNotifyProjectStarted1800010000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      'notification_settings',
      'notify_project_started',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'notification_settings',
      new TableColumn({
        name: 'notify_project_started',
        type: 'boolean',
        isNullable: false,
        default: true,
      }),
    );
  }
}
