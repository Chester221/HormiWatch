import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Amplía los campos de identificación del perfil para evitar
 * "value too long for type character varying(n)" al guardar Mi Perfil.
 * `whatsapp_phone` se deja intacto: ese campo se elimina de la interfaz.
 */
export class WidenUserProfileTextFields1800012000000
  implements MigrationInterface
{
  name = 'WidenUserProfileTextFields1800012000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // company se crea en AddUserCompany1800011000000 (pendiente en Neon).
    // Si aún no existe, se omite este ALTER sin romper la migración.
    if (await queryRunner.hasColumn('users_profiles', 'company')) {
      await queryRunner.query(
        `ALTER TABLE "users_profiles" ALTER COLUMN "company" TYPE character varying(100)`,
      );
    }

    await queryRunner.query(`
      ALTER TABLE "users_profiles"
        ALTER COLUMN "idCard" TYPE character varying(100),
        ALTER COLUMN "position" TYPE character varying(100),
        ALTER COLUMN "deparment" TYPE character varying(100)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recortar antes de encoger para que el rollback no falle con datos largos.
    await queryRunner.query(`
      UPDATE "users_profiles" SET "idCard" = LEFT("idCard", 15) WHERE LENGTH("idCard") > 15
    `);
    await queryRunner.query(`
      UPDATE "users_profiles" SET "position" = LEFT("position", 40) WHERE LENGTH("position") > 40
    `);
    await queryRunner.query(`
      UPDATE "users_profiles" SET "deparment" = LEFT("deparment", 50) WHERE LENGTH("deparment") > 50
    `);

    await queryRunner.query(`
      ALTER TABLE "users_profiles"
        ALTER COLUMN "idCard" TYPE character varying(15),
        ALTER COLUMN "position" TYPE character varying(40),
        ALTER COLUMN "deparment" TYPE character varying(50)
    `);
  }
}
