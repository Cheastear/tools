import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  WsException,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { DefaultEventsMap, Server, Socket } from 'socket.io';
import { TempChatService } from './temp-chat.service';
import { MessageDto } from './dto/message.dto';
import { TempChatMessageService } from './temp-chat-message.service';
import { JoinChatDto } from './dto/join-chat.dto';
import { WS_EVENTS } from '../utils/constants';

interface TempChatSocketData {
  username?: string;
  chatId?: string;
}

type TempChatSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  TempChatSocketData
>;

@WebSocketGateway({ namespace: '/temp-chat', cors: true })
export class TempChatGateway implements OnGatewayDisconnect<TempChatSocket> {
  @WebSocketServer()
  server: Server;

  private readonly participants = new Map<string, Set<string>>();

  constructor(
    private readonly tempChatService: TempChatService,
    private readonly tempChatMessageService: TempChatMessageService,
  ) {}

  @SubscribeMessage('joinChat')
  async handleJoin(
    @ConnectedSocket() client: TempChatSocket,
    @MessageBody() { chatId, username }: JoinChatDto,
  ) {
    TempChatGateway.validateUsername(username);

    client.data.username = username;
    client.data.chatId = chatId;

    const chat = await this.tempChatService.findOne({ chatId: chatId });
    if (!chat) throw new WsException('Chat with this id does not exist');

    void client.join(`chat:${chatId}`);
    this.addParticipant(chatId, username);

    const saved = await this.tempChatMessageService.create({
      chat: chat,
      message: `User '${username}' connect to the chat.`,
      author: "'system'",
    });

    this.server.to(`chat:${chatId}`).emit(WS_EVENTS.NEW_MESSAGE, saved);
    this.emitParticipants(chatId);
  }

  @SubscribeMessage('leaveChat')
  async handleLeave(@ConnectedSocket() client: TempChatSocket) {
    await this.removeFromChat(client);
  }

  async handleDisconnect(client: TempChatSocket) {
    await this.removeFromChat(client);
  }

  private async removeFromChat(client: TempChatSocket) {
    const { chatId, username } = client.data;
    if (!chatId || !username) return;

    void client.leave(`chat:${chatId}`);
    this.removeParticipant(chatId, username);

    client.data.chatId = undefined;
    client.data.username = undefined;

    const chat = await this.tempChatService
      .findOne({ chatId })
      .catch(() => null);
    if (!chat) return;

    const saved = await this.tempChatMessageService.create({
      chat,
      message: `User '${username}' left the chat.`,
      author: "'system'",
    });

    this.server.to(`chat:${chatId}`).emit(WS_EVENTS.NEW_MESSAGE, saved);
    this.emitParticipants(chatId);
  }

  private addParticipant(chatId: string, username: string) {
    if (!this.participants.has(chatId)) {
      this.participants.set(chatId, new Set());
    }
    this.participants.get(chatId)!.add(username);
  }

  private removeParticipant(chatId: string, username: string) {
    const chatParticipants = this.participants.get(chatId);
    if (!chatParticipants) return;

    chatParticipants.delete(username);
    if (chatParticipants.size === 0) this.participants.delete(chatId);
  }

  private emitParticipants(chatId: string) {
    const chatParticipants = [...(this.participants.get(chatId) ?? [])];
    this.server
      .to(`chat:${chatId}`)
      .emit(WS_EVENTS.PARTICIPANTS_UPDATED, chatParticipants);
  }

  @SubscribeMessage('message')
  async message(
    @ConnectedSocket() client: TempChatSocket,
    @MessageBody() { chatId, message }: MessageDto,
  ) {
    TempChatGateway.validateUsername(client.data.username);

    const chat = await this.tempChatService.findOne({ chatId: chatId });
    if (!chat) throw new WsException('Chat with this id does not exist');

    const saved = await this.tempChatMessageService.create({
      chat: chat,
      message,
      author: client.data.username!,
    });

    this.server.to(`chat:${chatId}`).emit(WS_EVENTS.NEW_MESSAGE, saved);

    return this.tempChatService.findOne({ chatId });
  }

  private static validateUsername(username?: string) {
    if (!username) throw new WsException("User don't have an username");
  }
}
