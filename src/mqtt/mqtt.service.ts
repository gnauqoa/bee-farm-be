import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, MqttClient } from 'mqtt';
import { error, info } from 'ps-logger';
import { DevicesService } from '../devices/devices.service';
import {
  DeviceEntity,
  DeviceStatus,
} from '../devices/infrastructure/persistence/relational/entities/device.entity';
import { AppGateway } from '../app.gateway';

@Injectable()
export class MqttService implements OnModuleInit {
  private mqttClient: MqttClient;

  constructor(
    private configService: ConfigService,
    private deviceService: DevicesService,
    private readonly appGateway: AppGateway,
  ) {}

  onModuleInit() {
    const connectUrl = this.configService.getOrThrow<string>('app.mqttDomain', {
      infer: true,
    });

    const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

    this.mqttClient = connect(connectUrl, {
      clientId,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });

    this.mqttClient.on('connect', () => {
      info('Connected to CloudMQTT');

      this.mqttClient.subscribe('device:update', (err) => {
        if (err) {
          error('Error subscribing to device:update');
        } else {
          info('Subscribed to device:update');
        }
      });
    });

    this.mqttClient.on('message', (topic, message) => {
      info(`📩 Received message on ${topic}: ${message.toString()}`);

      if (topic === 'device:update') {
        this.handleDeviceUpdate(JSON.parse(message.toString()))
          .then(() => {})
          .catch(() => {});
      }
    });

    this.mqttClient.on('error', (err) => {
      error(`Error in connecting to CloudMQTT: ${err}`);
    });
  }

  private async handleDeviceUpdate(data: DeviceEntity) {
    info(`Device update: ${JSON.stringify(data)}`);

    const newDevice = await this.deviceService.updateDevice(data.id, {
      btn1: data.btn1,
      btn2: data.btn2,
      btn3: data.btn3,
      btn4: data.btn4,
      lux: data.lux,
      temp: data.temp,
      humi: data.humi,
      status: DeviceStatus.ONLINE,
    });

    this.appGateway.emitToClients(`device:${data.id}`, newDevice);
  }
}
