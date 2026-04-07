import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TempChatMessage } from './temp-chat-message.entity';

@Entity('temp_chat')
export class TempChat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  chatId: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => TempChatMessage, (message) => message.chat)
  messages: Array<TempChatMessage>;
}
