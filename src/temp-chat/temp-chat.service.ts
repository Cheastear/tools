import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TempChat } from './entities/temp-chat.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { uuid } from '../utils/rand-uuid';

@Injectable()
export class TempChatService {
  constructor(
    @InjectRepository(TempChat)
    private readonly repo: Repository<TempChat>,
  ) {}

  async create() {
    let chatId: string;
    let exists: TempChat | null;

    do {
      chatId = uuid(8);
      exists = await this.repo.findOne({ where: { chatId } });
    } while (exists);

    const chat = this.repo.create({ chatId });
    const result = await this.repo.save(chat);
    return result;
  }

  async findOne(chat: Partial<TempChat>): Promise<TempChat> {
    const chatEntity = await this.repo.findOne({
      where: chat,
      relations: ['messages'],
    });
    if (!chatEntity) throw new NotFoundException('');

    return chatEntity;
  }

  async remove(chat: Partial<TempChat>) {
    const result = await this.repo.delete(chat);
    if (result.affected === 0)
      throw new NotFoundException('This chat does not exist');
    return result;
  }

  async deleteUnusedChat() {
    // Delete chats whose last message was created more than 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const chatsToDelete = await this.repo
      .createQueryBuilder('chat')
      .leftJoin('chat.messages', 'message')
      .addSelect('MAX(message.createdAt)', 'lastMessageAt')
      .groupBy('chat.id')
      .having('MAX(message.createdAt) < :twoHoursAgo', { twoHoursAgo })
      .getMany();

    const result = await this.repo.remove(chatsToDelete);
    Logger.log(
      `Deleted ${result.length} expired chats (last message older than 2 hours)`,
    );
  }
}
