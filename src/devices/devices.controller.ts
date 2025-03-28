import { Controller, Request, UseGuards } from '@nestjs/common';
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
import { RoleEnum } from '../roles/roles.enum';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { AuthGuard } from '@nestjs/passport';
import { SCondition } from '@dataui/crud-request/lib/types/request-query.types';
import { DeviceOwnershipGuard } from './device-ownership.guard';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
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
    sort: [{ field: 'createdAt', order: 'ASC' }],
  },
  params: {
    id: {
      field: 'id',
      type: 'number',
      primary: true,
    },
  },
  routes: {
    exclude: ['replaceOneBase', 'recoverOneBase'],
  },
})
@ApiTags('Devices')
@Controller({ path: 'devices', version: '1' })
export class DevicesController implements CrudController<DeviceEntity> {
  constructor(public service: DevicesService) {}

  get base(): CrudController<DeviceEntity> {
    return this;
  }

  @Override('getManyBase')
  async ovGetManyBase(
    @ParsedRequest() req: CrudRequest,
    @Request() request: any,
  ): Promise<any> {
    const user = request.user;
    const userId: number = user.id;
    const userRoleId: number = user.role.id;

    if (userRoleId !== RoleEnum.admin) {
      const userIdFilter: SCondition = { user_id: { $eq: userId } };
      if (req.parsed.search && '$and' in req.parsed.search) {
        req.parsed.search.$and = [
          ...(req.parsed.search.$and || []),
          userIdFilter,
        ];
      } else {
        req.parsed.search = { $and: [req.parsed.search || {}, userIdFilter] };
      }
    }

    return await this.service.getMany(req);
  }

  @Override('getOneBase')
  @UseGuards(DeviceOwnershipGuard)
  ovGetOneBase(
    @ParsedRequest() req: CrudRequest,
    @Request() request: any,
  ): Promise<DeviceEntity> {
    return request.device;
  }

  @Override('updateOneBase')
  @UseGuards(DeviceOwnershipGuard)
  async ovUpdateOneBase(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: UpdateDeviceDto,
  ): Promise<DeviceEntity> {
    return await this.service.updateDevice(req, dto);
  }

  @Override('deleteOneBase')
  @UseGuards(DeviceOwnershipGuard)
  async ovDeleteOneBase(
    @ParsedRequest() req: CrudRequest,
  ): Promise<void | DeviceEntity> {
    return await this.service.deleteOne(req);
  }
}
