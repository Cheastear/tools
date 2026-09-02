import { MigrationInterface, QueryRunner } from 'typeorm';

export class ShortLink1775503654946 implements MigrationInterface {
  name = 'ShortLink1775503654946';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "short_links" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, "originalUrl" character varying NOT NULL, "clicks" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "expiresAt" TIMESTAMP NOT NULL, CONSTRAINT "UQ_d9e777e466e606d53d51398311d" UNIQUE ("code"), CONSTRAINT "PK_c3adbf03db8463f26000c7457a7" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "short_links"`);
  }
}
