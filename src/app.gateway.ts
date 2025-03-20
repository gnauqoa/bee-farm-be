import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true }) // Cho phép CORS để client kết nối
export class AppGateway {
  @WebSocketServer()
  server: Server;

  // Xử lý khi client gửi tin nhắn
  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() message: string,
    @ConnectedSocket() client: Socket,
  ): void {
    console.log(`Received message from ${client.id}: ${message}`);
    this.server.emit('message', message); // Gửi tin nhắn cho tất cả client
  }

  // Xử lý khi có client kết nối
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  // Xử lý khi client ngắt kết nối
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
}
