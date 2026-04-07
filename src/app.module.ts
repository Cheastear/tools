import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from './data.source';
import { ShortLinkModule } from './short-link/short-link.module';
import { TempChatModule } from './temp-chat/temp-chat.module';
import { CleanupService } from './cleanup.service';
import 'dotenv/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(AppDataSource.options),
    ShortLinkModule,
    TempChatModule,
  ],
  controllers: [],
  providers: [CleanupService],
})
export class AppModule {}
