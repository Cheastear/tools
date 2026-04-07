import { Injectable } from '@nestjs/common';
import * as cron from 'node-cron';
import { ShortLinkService } from './short-link/short-link.service';
import { TempChatService } from './temp-chat/temp-chat.service';

@Injectable()
export class CleanupService {
  constructor(
    private readonly shortLinkService: ShortLinkService,
    private readonly tempChatService: TempChatService,
  ) {
    // run every day at 2:00 AM
    cron.schedule('0 */3 * * *', () => {
      void this.shortLinkService.deleteExpiredLinks();
    });

    cron.schedule('0 */1 * * *', () => {
      void this.tempChatService.deleteUnusedChat();
    });
  }
}
