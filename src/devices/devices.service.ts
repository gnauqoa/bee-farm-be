import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import {
  DeviceEntity,
  DeviceStatus,
} from './infrastructure/persistence/relational/entities/device.entity';
import { MqttService } from '../mqtt/mqtt.service';
import {
  UpdateDeviceDto,
  UpdateDevicePinDto,
  UpdateDeviceSensorDto,
} from './dto/update-device.dto';
import { SocketIoGateway } from '../socket-io/socket-io.gateway';
import { info } from 'ps-logger';
import { Repository, QueryRunner } from 'typeorm';
import { CrudRequest } from '@dataui/crud';

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

  async socketUpdate(id: number, payload: UpdateDevicePinDto) {
    const queryRunner: QueryRunner =
      this.repo.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const device = await queryRunner.manager.findOne(DeviceEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!device) {
        throw new Error('Device not found');
      }

      if (
        device.btn1 !== payload.btn1 ||
        device.btn2 !== payload.btn2 ||
        device.btn3 !== payload.btn3 ||
        device.btn4 !== payload.btn4 ||
        device.tempRange !== payload.tempRange ||
        device.humiRange !== payload.humiRange ||
        device.luxRange !== payload.luxRange ||
        device.mosfetSpeed !== payload.mosfetSpeed ||
        device.autoControl !== payload.autoControl
      ) {
        info(`Device updated: ${JSON.stringify(payload)}`);

        await queryRunner.manager.update(DeviceEntity, id, payload);

        await queryRunner.commitTransaction();

        this.mqttService.publicMessage(`device/${id}`, {
          btn1: payload.btn1,
          btn2: payload.btn2,
          btn3: payload.btn3,
          btn4: payload.btn4,
          tempRange: payload.tempRange,
          humiRange: payload.humiRange,
          luxRange: payload.luxRange,
          mosfetSpeed: payload.mosfetSpeed,
          autoControl: payload.autoControl,
        });
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

  async mqttUpdate(id: number, device: UpdateDeviceSensorDto) {
    const queryRunner: QueryRunner =
      this.repo.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingDevice = await queryRunner.manager.findOne(DeviceEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!existingDevice) {
        throw new Error('Device not found');
      }

      await queryRunner.manager.update(DeviceEntity, id, {
        ...device,
        status: DeviceStatus.ONLINE,
      });

      const newDevice = await queryRunner.manager.findOne(DeviceEntity, {
        where: { id },
        join: {
          alias: 'device',
          leftJoinAndSelect: {
            user: 'device.user',
          },
        },
      });

      await queryRunner.commitTransaction();

      info(`Device updated: ${JSON.stringify(newDevice)}`);

      this.socketIoGateway.emitToRoom(`device/${id}`, 'device_data', newDevice);

      return newDevice;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateDevice(req: CrudRequest, dto: UpdateDeviceDto) {
    const newDevice = await this.updateOne(req, dto);

    this.socketIoGateway.emitToRoom(
      `device/${newDevice.id}`,
      'device_data',
      newDevice,
    );

    this.mqttService.publicMessage(`device/${newDevice.id}`, {
      btn1: newDevice.btn1,
      btn2: newDevice.btn2,
      btn3: newDevice.btn3,
      btn4: newDevice.btn4,
      tempRange: newDevice.tempRange,
      humiRange: newDevice.humiRange,
      luxRange: newDevice.luxRange,
      mosfetSpeed: newDevice.mosfetSpeed,
      autoControl: newDevice.autoControl,
    });

    return newDevice;
  }
}
