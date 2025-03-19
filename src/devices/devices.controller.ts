import { Controller, UseGuards } from '@nestjs/common';
import { Crud, CrudController } from '@dataui/crud';
import { DeviceEntity } from './infrastructure/persistence/relational/entities/device.entity';
import { DevicesService } from './devices.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';

@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Crud({
  model: {
    type: DeviceEntity,
  },
  dto: {
    create: CreateDeviceDto,
    update: UpdateDeviceDto,
  },
  query: {
    alwaysPaginate: true,
    maxLimit: 100,
    limit: 10,
    cache: 0,
  },
})
@ApiTags('Devices')
@Controller({
  path: 'devices',
  version: '1',
})
export class DevicesController implements CrudController<DeviceEntity> {
  constructor(public service: DevicesService) {}
}
