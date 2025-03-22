import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayloadType } from './auth/strategies/types/jwt-payload.type';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from './config/config.type';
import { UserRepository } from './users/infrastructure/persistence/user.repository';

@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly userRepository: UserRepository,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token || client.handshake.query?.token;

    if (!token) {
      throw new UnauthorizedException('Token is missing');
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
      console.log(`WsAuthGuard error - ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
}
