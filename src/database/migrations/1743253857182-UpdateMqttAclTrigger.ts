import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMqttAclTrigger1743253857182 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Xóa trigger và function cũ nếu tồn tại
    await queryRunner.query(`
          DROP TRIGGER IF EXISTS trigger_create_mqtt_acl ON device;
          DROP FUNCTION IF EXISTS create_mqtt_acl_for_device;
        `);

    // Tạo function mới với rw = 999 cho topic "device/${device.id}"
    await queryRunner.query(`
          CREATE FUNCTION create_mqtt_acl_for_device() RETURNS TRIGGER AS $$
          BEGIN
              INSERT INTO mqtt_acl (topic, rw, device_id) VALUES
              (concat('device/', NEW.id), 999, NEW.id),
              (concat('device/', NEW.id, '/update'), 2, NEW.id);
              RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `);

    // Tạo trigger mới
    await queryRunner.query(`
          CREATE TRIGGER trigger_create_mqtt_acl
          AFTER INSERT ON device
          FOR EACH ROW
          EXECUTE FUNCTION create_mqtt_acl_for_device();
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Xóa trigger và function mới nếu rollback
    await queryRunner.query(`
          DROP TRIGGER IF EXISTS trigger_create_mqtt_acl ON device;
          DROP FUNCTION IF EXISTS create_mqtt_acl_for_device;
        `);
  }
}
