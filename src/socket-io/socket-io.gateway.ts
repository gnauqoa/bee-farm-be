import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { forwardRef, Inject, Injectable, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';
import { UserRepository } from '../users/infrastructure/persistence/user.repository';
import { WsAuthGuard } from './ws.guard';
import { info, error } from 'ps-logger';
import { DevicesService } from '../devices/devices.service';
import { WsDeviceGuard } from './ws-device.guard';

@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class SocketIoGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly userRepository: UserRepository,
    @Inject(forwardRef(() => DevicesService))
    private readonly deviceService: DevicesService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token || client.handshake.query?.token;

    if (!token) {
      error('Socket IO - Unauthorized connection');
      return false;
    }

    try {
      const jwtData = this.jwtService.verify<JwtPayloadType>(token, {
        secret: this.configService.getOrThrow('auth.secret', {
          infer: true,
        }),
      });

      const user = await this.userRepository.findById(jwtData.id);
      client.data.user = user; // Save user data into client
      return true;
    } catch (err) {
      error(`Socket IO - ${err.message}`);
    }
  }

  handleDisconnect(client: Socket) {
    info(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsAuthGuard, WsDeviceGuard)
  @SubscribeMessage('device:update-pin')
  async handleUpdateDevice(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!client.data.user) {
        client.emit('error', { error: 'Unauthorized' });
        return;
      }

      info(`Socket IO - Update device pin: ${JSON.stringify(data)}`);

      await this.deviceService.updateDevicePin(data.id, data);
    } catch (err) {
      error(`Socket IO - ${err.message}`);
    }
  }

  emitToClients(event: string, data: any) {
    this.server.emit(event, data);
  }

  emitToClient(clientId: string, event: string, data: any) {
    const client = this.server.sockets.sockets.get(clientId);
    if (client) {
      client.emit(event, data);
    }
  }
}
