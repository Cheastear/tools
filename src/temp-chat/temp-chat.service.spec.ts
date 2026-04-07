import { Test, TestingModule } from '@nestjs/testing';
import { TempChatService } from './temp-chat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from '../data.source';
import { TempChat } from './entities/temp-chat.entity';

describe('TempChatService', () => {
  let service: TempChatService;

  let chat: TempChat;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(AppDataSource.options),
        TypeOrmModule.forFeature([TempChat]),
      ],
      providers: [TempChatService],
    }).compile();

    service = module.get<TempChatService>(TempChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create chat', async () => {
    chat = await service.create();

    expect(chat.id).toBeDefined();
    expect(chat.chatId !== '').toBeTruthy();
  });

  it('should return chat', async () => {
    const result = await service.findOne({ chatId: chat.chatId });

    expect(result.id).toBe(chat.id);
  });

  it('should delete chat', async () => {
    const result = await service.remove({ id: chat.id });

    expect(result.affected).toBe(1);
  });
});
