import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceEntity } from '../../../../devices/infrastructure/persistence/relational/entities/device.entity';
import { deviceSeedService } from './device-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceEntity])],
  providers: [deviceSeedService],
  exports: [deviceSeedService],
})
export class DeviceSeedModule {}
