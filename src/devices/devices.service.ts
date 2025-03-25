import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import {
  DeviceEntity,
  DeviceStatus,
} from './infrastructure/persistence/relational/entities/device.entity';
import { MqttService } from '../mqtt/mqtt.service';
import {
  UpdateDevicePinDto,
  UpdateDeviceSensorDto,
} from './dto/update-device.dto';
import { SocketIoGateway } from '../socket-io/socket-io.gateway';
import { info } from 'ps-logger';
import { Repository, QueryRunner } from 'typeorm';

@Injectable()
export class DevicesService extends TypeOrmCrudService<DeviceEntity> {
  constructor(
    @InjectRepository(DeviceEntity) repo: Repository<DeviceEntity>,
    @Inject(forwardRef(() => MqttService))
    private mqttService: MqttService,
    @Inject(forwardRef(() => SocketIoGateway))
    private socketIoGateway: SocketIoGateway,
  ) {
    super(repo);
  }

  async updateDevicePin(id: number, payload: UpdateDevicePinDto) {
    const queryRunner: QueryRunner =
      this.repo.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lấy thiết bị với khóa PESSIMISTIC_WRITE
      const device = await queryRunner.manager.findOne(DeviceEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' }, // Khóa bản ghi để tránh xung đột
      });

      if (!device) {
        throw new Error('Device not found');
      }

      // Kiểm tra xem có thay đổi nào không
      if (
        device.btn1 !== payload.btn1 ||
        device.btn2 !== payload.btn2 ||
        device.btn3 !== payload.btn3 ||
        device.btn4 !== payload.btn4
      ) {
        info(`Device updated: ${JSON.stringify(payload)}`);

        // Cập nhật trong giao dịch
        await queryRunner.manager.update(DeviceEntity, id, payload);

        // Commit giao dịch
        await queryRunner.commitTransaction();

        // Gửi thông báo qua MQTT
        this.mqttService.publicMessage(`device/${id}`, payload);
        return payload;
      }

      await queryRunner.commitTransaction();
      return false;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err; // Ném lỗi để xử lý ở tầng trên
    } finally {
      await queryRunner.release();
    }
  }

  async updateDevice(id: number, device: UpdateDeviceSensorDto) {
    const queryRunner: QueryRunner =
      this.repo.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lấy thiết bị với khóa PESSIMISTIC_WRITE
      const existingDevice = await queryRunner.manager.findOne(DeviceEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' }, // Khóa bản ghi
      });

      if (!existingDevice) {
        throw new Error('Device not found');
      }

      // Cập nhật trong giao dịch
      await queryRunner.manager.update(DeviceEntity, id, {
        ...device,
        status: DeviceStatus.ONLINE,
      });

      // Lấy lại thông tin thiết bị với join
      const newDevice = await queryRunner.manager.findOne(DeviceEntity, {
        where: { id },
        join: {
          alias: 'device',
          leftJoinAndSelect: {
            user: 'device.user',
          },
        },
      });

      // Commit giao dịch
      await queryRunner.commitTransaction();

      info(`Device updated: ${JSON.stringify(newDevice)}`);

      // Gửi thông báo qua Socket.IO
      this.socketIoGateway.emitToRoom(
        `device/${id}`, // Sửa device.id thành id
        'device_data',
        newDevice,
      );

      return newDevice;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
