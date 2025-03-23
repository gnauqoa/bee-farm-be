import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { DevicesService } from '../devices/devices.service';
import { Socket } from 'socket.io';

@Injectable()
export class WsDeviceGuard implements CanActivate {
  constructor(private readonly devicesService: DevicesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const data = context.switchToWs().getData(); // Extract event data (contains device ID)

    if (!client.data.user) {
      console.error('WsDeviceGuard error: Unauthorized connection');
      return false;
    }

    const device = await this.devicesService.findOne({
      where: { id: data.deviceId },
    });

    if (!device) {
      console.error(`WsDeviceGuard error: Device ${data.deviceId} not found`);
      return false;
    }

    if (device.user_id !== client.data.user.id) {
      console.error(
        `WsDeviceGuard error: Device ${data.deviceId} not owned by user ${client.data.user.id}`,
      );
      return false;
    }

    return true;
  }
}
