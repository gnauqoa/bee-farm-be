import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateDeviceTable1710750000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'device',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'temp',
            type: 'float',
            isNullable: true,
          },
          {
            name: 'lux',
            type: 'float',
            isNullable: true,
          },
          {
            name: 'humi',
            type: 'float',
            isNullable: true,
          },
          {
            name: 'btn1',
            type: 'boolean',
            default: false,
          },
          {
            name: 'btn2',
            type: 'boolean',
            default: false,
          },
          {
            name: 'btn3',
            type: 'boolean',
            default: false,
          },
          {
            name: 'btn4',
            type: 'boolean',
            default: false,
          },
          {
            name: 'position',
            type: 'point',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['online', 'offline'],
            default: "'offline'",
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Tạo khóa ngoại user_id -> user.id
    await queryRunner.createForeignKey(
      'device',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE', // Xóa user sẽ xóa luôn device của user đó
      }),
    );
    await queryRunner.query(
      `CREATE INDEX "idx_device_position" ON "device" USING GIST ("position")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('device');
  }
}
