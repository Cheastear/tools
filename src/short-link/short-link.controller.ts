import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ShortLinkService } from './short-link.service';
import { CreateShortLinkDto } from './dto/create-short-link.dto';
import { Response } from 'express';

@Controller('short-link')
export class ShortLinkController {
  constructor(private readonly service: ShortLinkService) {}

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post()
  async createLink(@Body() body: CreateShortLinkDto) {
    return await this.service.create(body);
  }

  @Get(':code/stats')
  async stats(@Param('code') code: string) {
    return await this.service.getStats({ code });
  }

  @Delete(':code')
  async deleteLink(
    @Param('code') code: string,
    @Headers('x-delete-token') deleteToken: string,
  ) {
    return await this.service.deleteLink(code, deleteToken);
  }

  @Get(':code')
  async redirect(@Param('code') code: string, @Res() res: Response) {
    const link = await this.service.getLink({ code });

    if (!link) {
      return res.status(404).send('Link not found');
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      return res.status(410).send('Link expired');
    }

    await this.service.incrementClicks({ code });

    return res.redirect(link.originalUrl);
  }
}
