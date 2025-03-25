import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';

import {
  DeviceEntity,
  DeviceStatus,
} from './infrastructure/persistence/relational/entities/device.entity';
import { info } from 'ps-logger';
import { MqttService } from '../mqtt/mqtt.service';
import {
  UpdateDevicePinDto,
  UpdateDeviceSensorDto,
} from './dto/update-device.dto';
import { SocketIoGateway } from '../socket-io/socket-io.gateway';

@Injectable()
export class DevicesService extends TypeOrmCrudService<DeviceEntity> {
  constructor(
    @InjectRepository(DeviceEntity) repo,
    @Inject(forwardRef(() => MqttService))
    private mqttService: MqttService,
    @Inject(forwardRef(() => SocketIoGateway))
    private socketIoGateway: SocketIoGateway,
  ) {
    super(repo);
  }

  async updateDevicePin(id: number, device: UpdateDevicePinDto) {
    info(
      `Device updated pin: ${device.id}, btn1: ${device.btn1}, btn2: ${device.btn2}, btn3: ${device.btn3}, btn4: ${device.btn4}`,
    );

    await this.repo.update(id, device);

    const newDevice = await this.repo.findOne({
      where: { id },
    });

    this.mqttService.publicMessage(`device:${device.id}`, device);

    return newDevice;
  }

  async updateDevice(id: number, device: UpdateDeviceSensorDto) {
    await this.repo.update(id, { ...device, status: DeviceStatus.ONLINE });

    const newDevice = await this.repo.findOne({
      where: { id },
      join: {
        alias: 'device',
        leftJoinAndSelect: {
          user: 'device.user',
        },
      },
    });

    this.socketIoGateway.emitToClients(`device:${device.id}`, newDevice);

    return newDevice;
  }
}
