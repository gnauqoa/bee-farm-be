import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLastUpdateToDevice1743135499585 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "device" ADD COLUMN "lastUpdate" TIMESTAMP;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "device" DROP COLUMN "lastUpdate";
        `);
  }
}
