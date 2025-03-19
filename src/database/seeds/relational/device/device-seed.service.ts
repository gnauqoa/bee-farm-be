import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeviceEntity } from '../../../../devices/infrastructure/persistence/relational/entities/device.entity';
import { Repository } from 'typeorm';

const devices = [
  {
    name: 'Device 1',
    position: {
      x: 10.7769,
      y: 106.7009,
    },
  },
  {
    name: 'Device 2',
    position: {
      x: 10.7769,
      y: 106.7009,
    },
  },
  {
    name: 'Device 3',
    position: {
      x: 10.7769,
      y: 106.7009,
    },
  },
];

@Injectable()
export class deviceSeedService {
  constructor(
    @InjectRepository(DeviceEntity)
    private repository: Repository<DeviceEntity>,
  ) {}

  async run() {
    await this.repository.delete({});
    console.log('Run seed device module');
    for (const device of devices) {
      await this.repository.save(
        this.repository.create({
          name: device.name,
        }),
      );
    }
  }
}
