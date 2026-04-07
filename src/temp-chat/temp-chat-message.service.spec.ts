import { Test, TestingModule } from '@nestjs/testing';
import { TempChatMessageService } from './temp-chat-message.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from '../data.source';
import { TempChatMessage } from './entities/temp-chat-message.entity';
import { TempChat } from './entities/temp-chat.entity';
import { TempChatService } from './temp-chat.service';

describe('TempChatMessageService', () => {
  let service: TempChatMessageService;
  let chatService: TempChatService;

  const test_messages: Array<Pick<TempChatMessage, 'text' | 'author'>> = [
    {
      text: 'message to test1 application',
      author: 'test1',
    },
    {
      text: 'message to test2 application',
      author: 'test2',
    },
  ];

  let chat: TempChat;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(AppDataSource.options),
        TypeOrmModule.forFeature([TempChat, TempChatMessage]),
      ],
      providers: [TempChatService, TempChatMessageService],
    }).compile();

    chatService = module.get<TempChatService>(TempChatService);
    service = module.get<TempChatMessageService>(TempChatMessageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(chatService).toBeDefined();
  });

  it('should create chat and add messages to chat', async () => {
    const result = await chatService.create();

    await Promise.all(
      test_messages.map(
        async (message) =>
          await service.create({
            chat: result,
            message: message.text,
            author: message.author,
          }),
      ),
    );

    chat = await chatService.findOne({ id: result.id });

    expect(chat.id).toBeDefined();
    expect(chat.chatId).toBeDefined();

    expect(chat.messages.length).toBe(1);
  });

  // it('should delete chat with cascade all messages', async () => {
  //   const messageCount = chat.messages.length;

  //   const result = await chatService.remove({ id: chat.id });

  //   expect(result.affected).toBe(1);
  // });
});
