import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { ConfigModule } from '@nestjs/config';
import { AppGateway } from '../app.gateway';
import { DevicesModule } from '../devices/devices.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ConfigModule, DevicesModule, AuthModule, UsersModule],
  providers: [MqttService, AppGateway],
  exports: [MqttService],
})
export class MqttModule {}
