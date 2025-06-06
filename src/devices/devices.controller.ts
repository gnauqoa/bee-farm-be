import { Controller, Get, Request, UseGuards } from '@nestjs/common';
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
import crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { CreateDeviceDto } from './dto/create-device.dto';
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Crud({
  model: { type: DeviceEntity },
  dto: {
    update: UpdateDeviceDto,
    create: CreateDeviceDto,
  },
  query: {
    alwaysPaginate: true,
    maxLimit: 100,
    limit: 10,
    cache: 0,
    softDelete: true,
    join: {
      user: { eager: true },
    },
    filter: [
      {
        field: 'is_admin',
        operator: 'eq',
        value: false,
      },
    ],
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
  constructor(
    public service: DevicesService,
    @InjectRepository(DeviceEntity) public repo: Repository<DeviceEntity>,
  ) {}

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
    const adminFilter: SCondition = { is_admin: false };

    if (userRoleId !== RoleEnum.admin) {
      const userIdFilter: SCondition = { user_id: { $eq: userId } };

      if (req.parsed.search && '$and' in req.parsed.search) {
        req.parsed.search.$and = [
          ...(req.parsed.search.$and || []),
          userIdFilter,
          adminFilter,
        ];
      } else {
        req.parsed.search = {
          $and: [req.parsed.search || {}, userIdFilter, adminFilter],
        };
      }
    }

    return await this.service.getMany(req);
  }

  @Override('getOneBase')
  @UseGuards(DeviceOwnershipGuard)
  ovGetOneBase(@Request() request: any): Promise<DeviceEntity> {
    return request.device;
  }

  @Override('updateOneBase')
  @UseGuards(DeviceOwnershipGuard)
  async ovUpdateOneBase(
    @ParsedRequest() req: CrudRequest,
    @ParsedBody() dto: UpdateDeviceDto,
  ): Promise<DeviceEntity> {
    return await this.service.updateOne(req, {
      ...dto,
      user: dto.user_id ? { id: dto.user_id } : undefined,
    });
  }

  @Get(':id/password')
  @UseGuards(DeviceOwnershipGuard)
  async getDevicePassword(
    @ParsedRequest() req: CrudRequest,
    @Request() request: any,
  ): Promise<DeviceEntity> {
    const device_pass = crypto
      .createHash('md5')
      .update(Math.random().toString())
      .digest('hex');
    const device_hash = await bcrypt.hash(device_pass, 10);

    await this.repo.update(request.device.id, {
      device_pass: device_hash,
    });

    return { ...request.device, device_pass: device_pass };
  }

  @Override('deleteOneBase')
  @UseGuards(DeviceOwnershipGuard)
  async ovDeleteOneBase(
    @ParsedRequest() req: CrudRequest,
  ): Promise<void | DeviceEntity> {
    return await this.service.deleteOne(req);
  }
}
