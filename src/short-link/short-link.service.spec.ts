import { Test, TestingModule } from '@nestjs/testing';
import { ShortLinkService } from './short-link.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from '../data.source';
import { ShortLink } from './entity/short-link.entity';

describe('ShortLinkService', () => {
  let service: ShortLinkService;

  let link: ShortLink;

  const testLink = 'test.com/superlink';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(AppDataSource.options),
        TypeOrmModule.forFeature([ShortLink]),
      ],
      providers: [ShortLinkService],
    }).compile();

    service = module.get<ShortLinkService>(ShortLinkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create link', async () => {
    link = await service.create({ originalUrl: testLink });

    expect(link.originalUrl).toBe(testLink);
  });

  it('should return link entity', async () => {
    const linkEntity = await service.getLink({ code: link.code });

    expect(linkEntity.id).toBe(link.id);
    expect(linkEntity.code).toBe(link.code);
    expect(linkEntity.originalUrl).toBe(link.originalUrl);
  });

  it('should increase clicks link', async () => {
    const before = await service.getLink({ code: link.code });
    await service.incrementClicks({ code: link.code });
    const after = await service.getLink({ code: link.code });

    expect(before.originalUrl).toBe(after.originalUrl);
    expect(before.clicks).toBe(link.clicks);
    expect(before.clicks + 1).toBe(after.clicks);

    link = after;
  });

  it('should delete link', async () => {
    const result = await service.deleteLink(link.code, link.deleteToken);

    const isExist = await service.getLink({ id: link.id }).catch(() => false);

    expect(result.affected).toBe(1);
    expect(isExist).toBe(false);
  });
});
