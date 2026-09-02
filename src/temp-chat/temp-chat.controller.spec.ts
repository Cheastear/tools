import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppDataSource } from '../data.source';
import { TempChatModule } from './temp-chat.module';
import { TempChat } from './entities/temp-chat.entity';
import { TempChatMessage } from './entities/temp-chat-message.entity';

describe('TempChatController (e2e)', () => {
  let app: INestApplication;
  let chatRepo: Repository<TempChat>;
  let messageRepo: Repository<TempChatMessage>;
  let chatId: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(AppDataSource.options),
        ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 30 }] }),
        TempChatModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    chatRepo = moduleRef.get<Repository<TempChat>>(
      getRepositoryToken(TempChat),
    );
    messageRepo = moduleRef.get<Repository<TempChatMessage>>(
      getRepositoryToken(TempChatMessage),
    );
  });

  afterAll(async () => {
    if (chatId) await chatRepo.delete({ chatId }).catch(() => undefined);
    await app.close();
  });

  it('creates a chat with a unique chatId', async () => {
    const res = await request(app.getHttpServer())
      .post('/temp-chat')
      .expect(201);
    const body = res.body as TempChat;

    expect(body.chatId).toBeDefined();
    expect(body.id).toBeDefined();

    chatId = body.chatId;
  });

  it('returns only messages created after the given id', async () => {
    const chat = await chatRepo.findOneByOrFail({ chatId });

    const first = await messageRepo.save(
      messageRepo.create({ chat, text: 'first message', author: 'alice' }),
    );
    await messageRepo.save(
      messageRepo.create({ chat, text: 'second message', author: 'bob' }),
    );

    const res = await request(app.getHttpServer())
      .get('/temp-chat/messages-from-id')
      .send({ chatId, messageIdFrom: first.id })
      .expect(200);
    const body = res.body as TempChatMessage[];

    expect(body).toHaveLength(1);
    expect(body[0].text).toBe('second message');
    expect(body[0].author).toBe('bob');
  });

  it('defaults messageIdFrom to 0 and returns all messages', async () => {
    const res = await request(app.getHttpServer())
      .get('/temp-chat/messages-from-id')
      .send({ chatId })
      .expect(200);
    const body = res.body as TempChatMessage[];

    expect(body).toHaveLength(2);
  });

  it('rejects a request without a chatId', async () => {
    await request(app.getHttpServer())
      .get('/temp-chat/messages-from-id')
      .send({})
      .expect(400);
  });
});
