import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';

import { DeviceEntity } from './infrastructure/persistence/relational/entities/device.entity';

@Injectable()
export class DevicesService extends TypeOrmCrudService<DeviceEntity> {
  constructor(@InjectRepository(DeviceEntity) repo) {
    super(repo);
  }

  async updateDevicePin(id: number, device: DeviceEntity) {
    console.log(
      `Device updated pin:`,
      device.id,
      device.btn1,
      device.btn2,
      device.btn3,
      device.btn4,
    );

    return await this.repo.update(id, {
      btn1: device.btn1,
      btn2: device.btn2,
      btn3: device.btn3,
      btn4: device.btn4,
    });
  }
}
