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
import { Injectable, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadType } from './auth/strategies/types/jwt-payload.type';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from './config/config.type';
import { UserRepository } from './users/infrastructure/persistence/user.repository';
import { DevicesService } from './devices/devices.service';
import { WsAuthGuard } from './guards/ws.guard';
import { WsDeviceGuard } from './guards/ws-device.guard';

@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly userRepository: UserRepository,
    private readonly deviceService: DevicesService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token || client.handshake.query?.token;

    if (!token) {
      console.log('Socket IO error - Unauthorized connection');
      return false;
    }

    try {
      const jwtData = this.jwtService.verify<JwtPayloadType>(token, {
        secret: this.configService.getOrThrow('auth.secret', {
          infer: true,
        }),
      });

      const user = await this.userRepository.findById(jwtData.id);

      client.data.user = user; // Lưu thông tin user vào client
      return true;
    } catch (error) {
      console.log(`Socket IO error - ${error.message}`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
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

      await this.deviceService.updateDevicePin(data.id, data);
    } catch (error) {
      console.log(`Socket IO error - ${error.message}`);
    }
  }
}
