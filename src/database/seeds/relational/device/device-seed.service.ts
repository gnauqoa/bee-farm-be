import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeviceEntity } from '../../../../devices/infrastructure/persistence/relational/entities/device.entity';
import { Repository } from 'typeorm';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { info } from 'ps-logger';
import { RoleEnum } from '../../../../roles/roles.enum';

const devices = [
  {
    name: 'Device 1',
    position: {
      x: 10.7769,
      y: 106.7009,
    },
    device_pass: 'password123',
  },
  {
    name: 'Device 2',
    position: {
      x: 10.7769,
      y: 106.7009,
    },
    device_pass: 'password123',
  },
  {
    name: 'Device 3',
    position: {
      x: 10.7769,
      y: 106.7009,
    },
    device_pass: 'password123',
  },
  {
    name: 'Device admin',
    is_admin: true,
    device_key: 'admin',
    device_pass: 'admin123',
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
    info('Run seed device module');
    await this.repository.delete({});
    const user = await this.userRepository.findOne({
      where: { role: { id: RoleEnum.admin } },
    });
    if (user)
      for (const device of devices) {
        await this.repository.save(
          this.repository.create({
            name: device.name,
            user_id: user.id,
            device_pass: device.device_pass,
            is_admin: device.is_admin,
            device_key: device.device_key,
          }),
        );
      }
  }
}
