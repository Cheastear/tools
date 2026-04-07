import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatedToMessage1775587846583 implements MigrationInterface {
    name = 'AddCreatedToMessage1775587846583'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "temp_chat_messages" DROP CONSTRAINT "FK_3f1b6775927eb2a262e2bab70e4"`);
        await queryRunner.query(`ALTER TABLE "temp_chat_messages" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "temp_chat_messages" ADD CONSTRAINT "FK_3f1b6775927eb2a262e2bab70e4" FOREIGN KEY ("chatId") REFERENCES "temp_chat"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "temp_chat_messages" DROP CONSTRAINT "FK_3f1b6775927eb2a262e2bab70e4"`);
        await queryRunner.query(`ALTER TABLE "temp_chat_messages" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "temp_chat_messages" ADD CONSTRAINT "FK_3f1b6775927eb2a262e2bab70e4" FOREIGN KEY ("chatId") REFERENCES "temp_chat"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
