import { Module } from '@nestjs/common';
import { TempChatService } from './temp-chat.service';
import { TempChatGateway } from './temp-chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TempChat } from './entities/temp-chat.entity';
import { TempChatMessageService } from './temp-chat-message.service';
import { TempChatMessage } from './entities/temp-chat-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TempChat, TempChatMessage])],
  exports: [TempChatService],
  providers: [TempChatGateway, TempChatService, TempChatMessageService],
})
export class TempChatModule {}
