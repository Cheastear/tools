import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 30 }],
    }),
    ShortLinkModule,
    TempChatModule,
  ],
  controllers: [],
  providers: [CleanupService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
