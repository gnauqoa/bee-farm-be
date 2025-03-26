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
        name: 'humiRange',
        type: 'float',
        isNullable: true,
      }),
      new TableColumn({
        name: 'luxRange',
        type: 'float',
        isNullable: true,
      }),
      new TableColumn({
        name: 'mosfetSpeed',
        type: 'float',
        isNullable: true,
      }),
      new TableColumn({
        name: 'autoControl',
        type: 'boolean',
        default: false,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('device', 'tempRange');
    await queryRunner.dropColumn('device', 'humiRange');
    await queryRunner.dropColumn('device', 'luxRange');
    await queryRunner.dropColumn('device', 'mosfetSpeed');
    await queryRunner.dropColumn('device', 'autoControl');
  }
}
