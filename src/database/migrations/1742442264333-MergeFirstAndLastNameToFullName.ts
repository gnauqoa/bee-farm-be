import { MigrationInterface, QueryRunner } from 'typeorm';

export class MergeFirstAndLastNameToFullName1710838889999
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 🔹 Thêm cột fullName
    await queryRunner.query(`
            ALTER TABLE "user" ADD COLUMN "fullName" VARCHAR(255);
        `);

    await queryRunner.query(`
            CREATE INDEX "idx_user_fullname" 
            ON "user" USING GIN (to_tsvector('simple', "fullName"));
        `);

    await queryRunner.query(`
            UPDATE "user" 
            SET "fullName" = CONCAT(COALESCE("firstName", ''), ' ', COALESCE("lastName", ''))
        `);

    // 🔹 Xóa cột firstName và lastName
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "firstName";`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "lastName";`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 🔹 Khôi phục lại firstName và lastName
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "firstName" VARCHAR(255);`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "lastName" VARCHAR(255);`,
    );

    // 🔹 Tách fullName thành firstName và lastName (tạm thời chia theo khoảng trắng)
    await queryRunner.query(`
            UPDATE "user"
            SET "firstName" = SPLIT_PART("fullName", ' ', 1),
                "lastName" = SPLIT_PART("fullName", ' ', 2)
        `);

    // 🔹 Xóa cột fullName
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "fullName";`);
  }
}
