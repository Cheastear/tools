import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TempChat } from './temp-chat.entity';

@Entity('temp_chat_messages')
export class TempChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TempChat, { onDelete: 'CASCADE' })
  chat: TempChat;

  @Column()
  text: string;

  @Column()
  author: string;

  @CreateDateColumn()
  createdAt: Date;
}
