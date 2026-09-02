import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateShortLinkDto } from './dto/create-short-link.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ShortLink } from './entity/short-link.entity';
import { LessThan, Repository } from 'typeorm';
import { uuid } from '../utils/rand-uuid';
import { secureToken } from '../utils/secure-token';

@Injectable()
export class ShortLinkService {
  constructor(
    @InjectRepository(ShortLink)
    private readonly repo: Repository<ShortLink>,
  ) {}

  async create({
    originalUrl,
    code: customCode,
  }: CreateShortLinkDto): Promise<ShortLink> {
    const code = customCode
      ? await this.reserveCustomCode(customCode)
      : await this.generateUniqueCode();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const deleteToken = secureToken();

    return await this.repo.save({
      originalUrl,
      code,
      expiresAt,
      deleteToken,
    });
  }

  private async reserveCustomCode(code: string): Promise<string> {
    const exists = await this.repo.findOne({ where: { code } });
    if (exists) throw new ConflictException('This code is already taken');

    return code;
  }

  private async generateUniqueCode(): Promise<string> {
    let code: string;
    let exists: ShortLink | null;

    do {
      code = uuid(8);
      exists = await this.repo.findOne({ where: { code } });
    } while (exists);

    return code;
  }

  async getLink(link: Partial<ShortLink>): Promise<ShortLink> {
    const repoLink = await this.repo.findOneBy(link);

    if (!repoLink) throw new NotFoundException('Link does not exist');

    if (new Date() > repoLink.expiresAt)
      throw new GoneException('Link expired');

    return repoLink;
  }

  async getStats(
    link: Partial<ShortLink>,
  ): Promise<Omit<ShortLink, 'deleteToken'>> {
    const repoLink = await this.getLink(link);

    return {
      id: repoLink.id,
      code: repoLink.code,
      originalUrl: repoLink.originalUrl,
      clicks: repoLink.clicks,
      createdAt: repoLink.createdAt,
      expiresAt: repoLink.expiresAt,
    };
  }

  async incrementClicks(link: Partial<ShortLink>) {
    const repoLink = await this.getLink(link);

    repoLink.clicks += 1;

    return await this.repo.save(repoLink);
  }

  async deleteLink(code: string, deleteToken: string) {
    const repoLink = await this.getLink({ code });

    if (repoLink.deleteToken !== deleteToken)
      throw new ForbiddenException('Invalid delete token');

    return await this.repo.delete({ code });
  }

  async deleteExpiredLinks() {
    const result = await this.repo.delete({
      expiresAt: LessThan(new Date()),
    });

    Logger.log(`Deleted ${result.affected} expired links`);
  }
}
