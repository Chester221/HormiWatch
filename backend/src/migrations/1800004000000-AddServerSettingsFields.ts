import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddServerSettingsFields1800004000000 implements MigrationInterface {
    name = 'AddServerSettingsFields1800004000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            "notification_settings",
            new TableColumn({
                name: "discord_webhook_url",
                type: "varchar",
                length: "255",
                isNullable: true,
            })
        );

        await queryRunner.addColumn(
            "notification_settings",
            new TableColumn({
                name: "daily_summary",
                type: "jsonb",
                isNullable: false,
                default: "'{\"enabled\": true, \"startHour\": 8, \"endHour\": 17, \"include\": {\"created\": true, \"deleted\": true, \"expired\": true, \"expiring\": true, \"inactive\": true, \"started\": true, \"paused\": true, \"completed\": true, \"updated\": true}}'",
            })
        );

        await queryRunner.addColumn(
            "notification_settings",
            new TableColumn({
                name: "notify_project_started",
                type: "boolean",
                isNullable: false,
                default: true,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("notification_settings", "notify_project_started");
        await queryRunner.dropColumn("notification_settings", "daily_summary");
        await queryRunner.dropColumn("notification_settings", "discord_webhook_url");
    }
}
