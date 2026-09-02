import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { In, Repository } from 'typeorm';
import request from 'supertest';
import { AppDataSource } from '../data.source';
import { ShortLinkModule } from './short-link.module';
import { ShortLink } from './entity/short-link.entity';

describe('ShortLink rate limiting (e2e)', () => {
  let app: INestApplication;
  let repo: Repository<ShortLink>;
  const createdCodes: string[] = [];

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(AppDataSource.options),
        ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 30 }] }),
        ShortLinkModule,
      ],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    repo = moduleRef.get<Repository<ShortLink>>(getRepositoryToken(ShortLink));
  });

  afterAll(async () => {
    if (createdCodes.length) await repo.delete({ code: In(createdCodes) });
    await app.close();
  });

  it('allows up to 5 link creations per minute and blocks the 6th', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app.getHttpServer())
        .post('/short-link')
        .send({ originalUrl: `https://example.com/throttle-${i}` })
        .expect(201);

      createdCodes.push((res.body as ShortLink).code);
    }

    await request(app.getHttpServer())
      .post('/short-link')
      .send({ originalUrl: 'https://example.com/throttle-blocked' })
      .expect(429);
  });
});
