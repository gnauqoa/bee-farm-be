import { forwardRef, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, MqttClient } from 'mqtt';
import { error, info } from 'ps-logger';
import { DevicesService } from '../devices/devices.service';
import { DeviceEntity } from '../devices/infrastructure/persistence/relational/entities/device.entity';

@Injectable()
export class MqttService implements OnModuleInit {
  private mqttClient: MqttClient;

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => DevicesService))
    private deviceService: DevicesService,
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
      info('MQTT - Connected');

      this.mqttClient.subscribe('device/update', (err) => {
        if (err) {
          error('MQTT - Error subscribing to device/update');
        } else {
          info('MQTT - Subscribed device/update');
        }
      });
    });

    this.mqttClient.on('message', async (topic, message) => {
      if (topic === 'device/update') {
        await this.handleDeviceUpdate(JSON.parse(message.toString()));
      }
    });

    this.mqttClient.on('error', (err) => {
      error(`MQTT - Error in connecting to CloudMQTT: ${err}`);
    });
  }

  private async handleDeviceUpdate(data: DeviceEntity) {
    info(`MQTT - Device update sensor: ${JSON.stringify(data)}`);

    await this.deviceService.mqttUpdate(data.id, data);
  }

  public publicMessage(topic: string, message: any) {
    if (typeof message !== 'string') {
      message = JSON.stringify(message);
    }

    if (!this.mqttClient.connected) {
      error('MQTT - Client not connected');
      return;
    }

    this.mqttClient.publish(topic, message);
  }
}
