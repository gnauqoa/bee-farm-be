import {
  CanActivate,
  ExecutionContext,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { DevicesService } from '../devices/devices.service';
import { Socket } from 'socket.io';
import { error } from 'ps-logger';
import { RoleEnum } from '../roles/roles.enum';

@Injectable()
export class WsDeviceGuard implements CanActivate {
  constructor(
    @Inject(forwardRef(() => DevicesService))
    private readonly devicesService: DevicesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const data = context.switchToWs().getData(); // Extract event data (contains device ID)

    if (!client.data.user) {
      error('WsDeviceGuard error: Unauthorized connection');
      return false;
    }

    const user_id = client.data.user.id;
    const role = client.data.user.role;

    const device = await this.devicesService.findOne({
      where: { id: data.deviceId },
      join: {
        alias: 'device',
        leftJoinAndSelect: {
          user: 'device.user',
        },
      },
    });

    if (!device) {
      error(`WsDeviceGuard error: Device ${data.deviceId} not found`);
      return false;
    }

    if (role.id !== RoleEnum.admin && device.user_id !== user_id) {
      error(
        `WsDeviceGuard error: Permission denied for device ${data.deviceId}`,
      );
      return false;
    }

    client.data.device = device;

    return true;
  }
}
