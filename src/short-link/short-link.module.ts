import { Module } from '@nestjs/common';
import { ShortLinkService } from './short-link.service';
import { ShortLinkController } from './short-link.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShortLink } from './entity/short-link.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShortLink])],
  exports: [ShortLinkService],
  controllers: [ShortLinkController],
  providers: [ShortLinkService],
})
export class ShortLinkModule {}
