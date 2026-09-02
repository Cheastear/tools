import { MigrationInterface, QueryRunner } from 'typeorm';

export class ShortLinkDeleteToken1788344010073 implements MigrationInterface {
  name = 'ShortLinkDeleteToken1788344010073';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "short_links" ADD "deleteToken" character varying`,
    );
    await queryRunner.query(
      `UPDATE "short_links" SET "deleteToken" = md5(random()::text || clock_timestamp()::text) WHERE "deleteToken" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "short_links" ALTER COLUMN "deleteToken" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "short_links" ADD CONSTRAINT "UQ_short_links_delete_token" UNIQUE ("deleteToken")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "short_links" DROP CONSTRAINT "UQ_short_links_delete_token"`,
    );
    await queryRunner.query(
      `ALTER TABLE "short_links" DROP COLUMN "deleteToken"`,
    );
  }
}
