import { MigrationInterface, QueryRunner } from 'typeorm';

export class TempChatMessage1775583241539 implements MigrationInterface {
  name = 'TempChatMessage1775583241539';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "temp_chat_messages" ADD "text" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "temp_chat_messages" ADD "author" character varying NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "temp_chat_messages" DROP COLUMN "author"`,
    );
    await queryRunner.query(
      `ALTER TABLE "temp_chat_messages" DROP COLUMN "text"`,
    );
  }
}
