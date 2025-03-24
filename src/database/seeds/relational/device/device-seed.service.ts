import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeviceEntity } from '../../../../devices/infrastructure/persistence/relational/entities/device.entity';
import { Repository } from 'typeorm';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { info } from 'ps-logger';

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
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run() {
    await this.repository.delete({});
    const user = await this.userRepository.findOne({});
    info('Run seed device module');
    if (user)
      for (const device of devices) {
        await this.repository.save(
          this.repository.create({
            name: device.name,
            user,
          }),
        );
      }
  }
}
