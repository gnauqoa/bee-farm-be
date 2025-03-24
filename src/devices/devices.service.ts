import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';

import {
  DeviceEntity,
  DeviceStatus,
} from './infrastructure/persistence/relational/entities/device.entity';
import { info } from 'ps-logger';

@Injectable()
export class DevicesService extends TypeOrmCrudService<DeviceEntity> {
  constructor(@InjectRepository(DeviceEntity) repo) {
    super(repo);
  }

  async updateDevicePin(id: number, device: DeviceEntity) {
    info(
      `Device updated pin: ${device.id}, btn1: ${device.btn1}, btn2: ${device.btn2}, btn3: ${device.btn3}, btn4: ${device.btn4}`,
    );

    return await this.repo.update(id, {
      btn1: device.btn1,
      btn2: device.btn2,
      btn3: device.btn3,
      btn4: device.btn4,
      status: DeviceStatus.ONLINE,
    });
  }

  async updateDevice(id: number, device: Partial<DeviceEntity>) {
    await this.repo.update(id, device);
    return await this.repo.findOne({
      where: { id },
      join: { alias: 'device', leftJoinAndSelect: { user: 'device.user' } },
    });
  }
}
