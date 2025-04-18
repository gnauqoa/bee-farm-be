import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceEntity } from '../../../../devices/infrastructure/persistence/relational/entities/device.entity';
import { deviceSeedService } from './device-seed.service';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceEntity, UserEntity])],
  providers: [deviceSeedService],
  exports: [deviceSeedService],
})
export class DeviceSeedModule {}
