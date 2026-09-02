import { MigrationInterface, QueryRunner } from 'typeorm';

export class TempChat1775580827592 implements MigrationInterface {
  name = 'TempChat1775580827592';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "temp_chat_messages" ("id" SERIAL NOT NULL, "chatId" integer, CONSTRAINT "PK_b6eef7bbd11adf8137722dd67ac" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "temp_chat" ("id" SERIAL NOT NULL, "chatId" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "expiredAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_a2298e832dfa72055a879c92aca" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "temp_chat_messages" ADD CONSTRAINT "FK_3f1b6775927eb2a262e2bab70e4" FOREIGN KEY ("chatId") REFERENCES "temp_chat"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "temp_chat_messages" DROP CONSTRAINT "FK_3f1b6775927eb2a262e2bab70e4"`,
    );
    await queryRunner.query(`DROP TABLE "temp_chat"`);
    await queryRunner.query(`DROP TABLE "temp_chat_messages"`);
  }
}
