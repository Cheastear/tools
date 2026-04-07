import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveExpiredChat1775588622271 implements MigrationInterface {
    name = 'RemoveExpiredChat1775588622271'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "temp_chat" DROP COLUMN "expiredAt"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "temp_chat" ADD "expiredAt" TIMESTAMP NOT NULL`);
    }

}
