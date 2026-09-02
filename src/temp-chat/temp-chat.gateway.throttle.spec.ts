import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { Repository } from 'typeorm';
import { io, Socket } from 'socket.io-client';
import { AddressInfo, Server } from 'net';
import { AppDataSource } from '../data.source';
import { TempChatModule } from './temp-chat.module';
import { TempChatService } from './temp-chat.service';
import { TempChat } from './entities/temp-chat.entity';
import { WS_EVENTS } from '../utils/constants';

const waitForConnect = (socket: Socket) =>
  new Promise<void>((resolve) => socket.on('connect', () => resolve()));

describe('TempChatGateway message rate limiting (e2e)', () => {
  let app: INestApplication;
  let chatRepo: Repository<TempChat>;
  let chatId: string;
  let alice: Socket;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(AppDataSource.options),
        ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 30 }] }),
        TempChatModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0);

    const httpServer = app.getHttpServer() as Server;
    const address = httpServer.address() as AddressInfo;
    const baseUrl = `http://localhost:${address.port}`;

    chatRepo = moduleRef.get<Repository<TempChat>>(
      getRepositoryToken(TempChat),
    );
    const chatService = moduleRef.get<TempChatService>(TempChatService);
    const chat = await chatService.create();
    chatId = chat.chatId;

    alice = io(`${baseUrl}/temp-chat`, {
      transports: ['websocket'],
      reconnection: false,
    });
    await waitForConnect(alice);

    const joined = new Promise<void>((resolve) =>
      alice.once(WS_EVENTS.NEW_MESSAGE, () => resolve()),
    );
    alice.emit('joinChat', { chatId, username: 'alice' });
    await joined;
  });

  afterAll(async () => {
    alice.disconnect();
    await chatRepo.delete({ chatId }).catch(() => undefined);
    await app.close();
  });

  it('blocks messages once the per-socket limit is exceeded', async () => {
    let broadcastCount = 0;
    let blocked = false;

    alice.on(WS_EVENTS.NEW_MESSAGE, () => broadcastCount++);
    alice.on('exception', () => {
      blocked = true;
    });

    // The gateway's `message` handler is limited to 10 requests per 10s.
    for (let i = 0; i < 11; i++) {
      alice.emit('message', { chatId, message: `message ${i}` });
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(broadcastCount).toBeLessThanOrEqual(10);
    expect(blocked).toBe(true);
  });
});
