import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { UserRepository } from '../users/infrastructure/persistence/user.repository';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
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
      console.log(`WsAuthGuard error: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
