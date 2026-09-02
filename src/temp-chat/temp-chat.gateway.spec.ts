import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { In, Repository } from 'typeorm';
import { io, Socket } from 'socket.io-client';
import { AddressInfo, Server } from 'net';
import { AppDataSource } from '../data.source';
import { TempChatModule } from './temp-chat.module';
import { TempChatService } from './temp-chat.service';
import { TempChat } from './entities/temp-chat.entity';
import { WS_EVENTS } from '../utils/constants';

interface ChatMessage {
  text: string;
  author: string;
}

function collectEvents<T>(socket: Socket, event: string) {
  const queue: T[] = [];
  const waiters: Array<(value: T) => void> = [];

  socket.on(event, (payload: T) => {
    const waiter = waiters.shift();
    if (waiter) waiter(payload);
    else queue.push(payload);
  });

  return {
    next: (): Promise<T> =>
      new Promise((resolve) => {
        const value = queue.shift();
        if (value !== undefined) resolve(value);
        else waiters.push(resolve);
      }),
  };
}

const waitForConnect = (socket: Socket) =>
  new Promise<void>((resolve) => socket.on('connect', () => resolve()));

describe('TempChatGateway (e2e)', () => {
  let app: INestApplication;
  let chatRepo: Repository<TempChat>;
  let chatService: TempChatService;
  let alice: Socket;
  let bob: Socket;
  const chatIds: string[] = [];

  const createChat = async (): Promise<string> => {
    const chat = await chatService.create();
    chatIds.push(chat.chatId);
    return chat.chatId;
  };

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
    chatService = moduleRef.get<TempChatService>(TempChatService);

    // A single pair of long-lived sockets is reused across tests (each test
    // uses its own freshly created chat room) to avoid the connection churn
    // of opening/closing a websocket per test, which is flaky in sandboxed
    // environments.
    alice = io(`${baseUrl}/temp-chat`, {
      transports: ['websocket'],
      reconnection: false,
    });
    bob = io(`${baseUrl}/temp-chat`, {
      transports: ['websocket'],
      reconnection: false,
    });
    await Promise.all([waitForConnect(alice), waitForConnect(bob)]);
  });

  afterAll(async () => {
    alice.disconnect();
    bob.disconnect();
    if (chatIds.length) await chatRepo.delete({ chatId: In(chatIds) });
    await app.close();
  });

  it('broadcasts a join message and the participant list', async () => {
    const chatId = await createChat();
    const messages = collectEvents<ChatMessage>(alice, WS_EVENTS.NEW_MESSAGE);
    const participants = collectEvents<string[]>(
      alice,
      WS_EVENTS.PARTICIPANTS_UPDATED,
    );

    alice.emit('joinChat', { chatId, username: 'alice' });

    const joinMessage = await messages.next();
    expect(joinMessage.text).toBe("User 'alice' connect to the chat.");
    expect(joinMessage.author).toBe("'system'");

    const participantsList = await participants.next();
    expect(participantsList).toEqual(['alice']);

    alice.emit('leaveChat');
  });

  it('broadcasts chat messages to everyone in the room', async () => {
    const chatId = await createChat();
    const messages = collectEvents<ChatMessage>(alice, WS_EVENTS.NEW_MESSAGE);

    alice.emit('joinChat', { chatId, username: 'alice' });
    await messages.next();

    alice.emit('message', { chatId, message: 'hello there' });
    const received = await messages.next();

    expect(received.text).toBe('hello there');
    expect(received.author).toBe('alice');

    alice.emit('leaveChat');
  });

  it('notifies existing participants when someone else joins', async () => {
    const chatId = await createChat();
    const aliceMessages = collectEvents<ChatMessage>(
      alice,
      WS_EVENTS.NEW_MESSAGE,
    );
    const aliceParticipants = collectEvents<string[]>(
      alice,
      WS_EVENTS.PARTICIPANTS_UPDATED,
    );

    alice.emit('joinChat', { chatId, username: 'alice' });
    await aliceMessages.next();
    await aliceParticipants.next();

    bob.emit('joinChat', { chatId, username: 'bob' });

    const bobJoinMessage = await aliceMessages.next();
    expect(bobJoinMessage.text).toBe("User 'bob' connect to the chat.");

    const participantsList = await aliceParticipants.next();
    expect([...participantsList].sort()).toEqual(['alice', 'bob']);

    alice.emit('leaveChat');
    bob.emit('leaveChat');
  });

  it('broadcasts a leave message and updates participants on explicit leaveChat', async () => {
    const chatId = await createChat();
    const aliceMessages = collectEvents<ChatMessage>(
      alice,
      WS_EVENTS.NEW_MESSAGE,
    );
    const aliceParticipants = collectEvents<string[]>(
      alice,
      WS_EVENTS.PARTICIPANTS_UPDATED,
    );

    alice.emit('joinChat', { chatId, username: 'alice' });
    await aliceMessages.next();
    await aliceParticipants.next();

    bob.emit('joinChat', { chatId, username: 'bob' });
    await aliceMessages.next();
    await aliceParticipants.next();

    bob.emit('leaveChat');

    const leaveMessage = await aliceMessages.next();
    expect(leaveMessage.text).toBe("User 'bob' left the chat.");

    const participantsList = await aliceParticipants.next();
    expect(participantsList).toEqual(['alice']);

    alice.emit('leaveChat');
  });

  it('broadcasts a leave message and updates participants on disconnect', async () => {
    const chatId = await createChat();
    const aliceMessages = collectEvents<ChatMessage>(
      alice,
      WS_EVENTS.NEW_MESSAGE,
    );
    const aliceParticipants = collectEvents<string[]>(
      alice,
      WS_EVENTS.PARTICIPANTS_UPDATED,
    );

    alice.emit('joinChat', { chatId, username: 'alice' });
    await aliceMessages.next();
    await aliceParticipants.next();

    bob.emit('joinChat', { chatId, username: 'bob' });
    await aliceMessages.next();
    await aliceParticipants.next();

    bob.disconnect();

    const leaveMessage = await aliceMessages.next();
    expect(leaveMessage.text).toBe("User 'bob' left the chat.");

    const participantsList = await aliceParticipants.next();
    expect(participantsList).toEqual(['alice']);
  });
});
