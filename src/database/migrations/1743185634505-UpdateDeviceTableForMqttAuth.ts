import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateDeviceTableForMqttAuth1711630900000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    // Thêm các cột mới
    await queryRunner.query(`
        ALTER TABLE "device" 
        ADD COLUMN "is_admin" BOOLEAN DEFAULT FALSE,
        ADD COLUMN "device_key" VARCHAR NOT NULL UNIQUE DEFAULT md5(random()::text),
        ADD COLUMN "device_pass" VARCHAR NOT NULL DEFAULT md5(random()::text);
    `);

    // Mã hóa device_pass bằng bcrypt
    await queryRunner.query(`
        UPDATE "device" 
        SET "device_pass" = crypt("device_pass", gen_salt('bf', 10));
    `);

    // Xóa default cho device_pass
    await queryRunner.query(`
        ALTER TABLE "device"
        ALTER COLUMN "device_pass" DROP DEFAULT;
    `);

    // Tạo function để tự động cập nhật device_key
    await queryRunner.query(`
        CREATE FUNCTION update_device_key() RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.is_admin = FALSE THEN
                NEW.device_key = concat('dev_', NEW.id);
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);

    // Tạo trigger để tự động cập nhật device_key trước khi insert
    await queryRunner.query(`
        CREATE TRIGGER trigger_update_device_key
        BEFORE INSERT ON device
        FOR EACH ROW
        EXECUTE FUNCTION update_device_key();
    `);

    // Cập nhật device_key cho các bản ghi hiện có (nếu có)
    await queryRunner.query(`
        UPDATE "device" 
        SET "device_key" = concat('dev_', "id");
    `);

    // Tạo bảng mqtt_acl
    await queryRunner.query(`
        CREATE TABLE "mqtt_acl" (
            "id" SERIAL PRIMARY KEY,
            "topic" VARCHAR NOT NULL,
            "rw" INT NOT NULL,
            "device_id" INT NOT NULL,
            CONSTRAINT "fk_mqtt_acl_device" FOREIGN KEY ("device_id") REFERENCES "device"("id") ON DELETE CASCADE
        );
    `);

    // Tạo function để tự động thêm mqtt_acl
    await queryRunner.query(`
        CREATE FUNCTION create_mqtt_acl_for_device() RETURNS TRIGGER AS $$
        BEGIN
            INSERT INTO mqtt_acl (topic, rw, device_id) VALUES
            (concat('device/', NEW.id), 4, NEW.id),
            (concat('device/', NEW.id, '/update'), 2, NEW.id);
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);

    // Tạo trigger cho mqtt_acl
    await queryRunner.query(`
        CREATE TRIGGER trigger_create_mqtt_acl
        AFTER INSERT ON device
        FOR EACH ROW
        EXECUTE FUNCTION create_mqtt_acl_for_device();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TRIGGER IF EXISTS trigger_create_mqtt_acl ON device;',
    );
    await queryRunner.query(
      'DROP FUNCTION IF EXISTS create_mqtt_acl_for_device;',
    );
    await queryRunner.query(
      'DROP TRIGGER IF EXISTS trigger_update_device_key ON device;',
    );
    await queryRunner.query('DROP FUNCTION IF EXISTS update_device_key;');
    await queryRunner.query('DROP TABLE IF EXISTS "mqtt_acl";');
    await queryRunner.query('ALTER TABLE "device" DROP COLUMN "is_admin";');
    await queryRunner.query('ALTER TABLE "device" DROP COLUMN "device_key";');
    await queryRunner.query('ALTER TABLE "device" DROP COLUMN "device_pass";');
  }
}
