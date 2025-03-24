import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { DeviceEntity } from './infrastructure/persistence/relational/entities/device.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppGateway } from '../app.gateway';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceEntity]), AuthModule, UsersModule],
  controllers: [DevicesController],
  providers: [DevicesService, AppGateway],
  exports: [DevicesService, TypeOrmModule.forFeature([DeviceEntity])],
})
export class DevicesModule {}
