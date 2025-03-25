import { Controller, UseGuards } from '@nestjs/common';
import {
  Crud,
  CrudController,
  CrudRequest,
  Override,
  ParsedBody,
  ParsedRequest,
} from '@dataui/crud';
import { DeviceEntity } from './infrastructure/persistence/relational/entities/device.entity';
import { DevicesService } from './devices.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { SocketIoGateway } from '../socket-io/socket-io.gateway';

@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Crud({
  model: { type: DeviceEntity },
  dto: { update: UpdateDeviceDto },
  query: {
    alwaysPaginate: true,
    maxLimit: 100,
    limit: 10,
    cache: 0,
    softDelete: true,
    join: {
      user: { eager: true },
    },
  },
  params: {
    id: {
      field: 'id',
      type: 'number',
      primary: true,
    },
  },
})
@ApiTags('Devices')
@Controller({ path: 'devices', version: '1' })
export class DevicesController implements CrudController<DeviceEntity> {
  constructor(
    public service: DevicesService,
    private readonly socketIoGateway: SocketIoGateway,
  ) {}

  get base(): CrudController<DeviceEntity> {
    return this;
  }

  @Override('updateOneBase')
  async ovUpdateOneBase(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: UpdateDeviceDto,
  ): Promise<DeviceEntity> {
    const updatedDevice = await this.service.updateOne(req, dto);

    this.socketIoGateway.emitToClients(
      `device:${updatedDevice.id}`,
      updatedDevice,
    );

    return updatedDevice;
  }
}
