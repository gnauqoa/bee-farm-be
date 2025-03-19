import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';

import { DeviceEntity } from './infrastructure/persistence/relational/entities/device.entity';

@Injectable()
export class DevicesService extends TypeOrmCrudService<DeviceEntity> {
  constructor(@InjectRepository(DeviceEntity) repo) {
    super(repo);
  }
}
