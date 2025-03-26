import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTempRangeAndMosfetSpeed1742971432454
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('device', [
      new TableColumn({
        name: 'tempRange',
        type: 'float',
        isNullable: true,
      }),
      new TableColumn({
        name: 'mosfetSpeed',
        type: 'float',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('device', 'tempRange');
    await queryRunner.dropColumn('device', 'mosfetSpeed');
  }
}
